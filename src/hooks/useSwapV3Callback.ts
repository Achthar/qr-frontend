import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Percent, SwapRouter, SwapParameters, Swap, SwapType, Currency, NETWORK_CCY } from '@requiemswap/sdk'
import { useMemo } from 'react'
import { useGasPrice } from 'state/user/hooks'
import { BIPS_BASE, INITIAL_ALLOWED_SLIPPAGE } from '../config/constants'
import { useTransactionAdder } from '../state/transactions/hooks'
import { isAddress, shortenAddress, getSwapRouterContract } from '../utils'
import isZero from '../utils/isZero'
import useTransactionDeadline from './useTransactionDeadline'
import useENS from './ENS/useENS'


export enum SwapV3CallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface SwapV3Call {
  contract: Contract
  parameters: SwapParameters
}

interface SuccessfulCall {
  call: SwapV3Call
  gasEstimate: BigNumber
}

interface FailedCall {
  call: SwapV3Call
  error: Error
}

type EstimatedSwapCall = SuccessfulCall | FailedCall

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
function useSwapV3CallArguments(
  chainId: number,
  account: string,
  library: any,
  trade: Swap | undefined, // trade to execute, required
  input: Currency,
  output: Currency,
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapV3Call[] {

  // const { address: recipientAddress } = useENS(chainId, recipientAddressOrName)
  const recipient = recipientAddressOrName ?? account // recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline(chainId)

  return useMemo(() => {
    if (!input || !output || !trade || !recipient || !library || !account || !chainId || !deadline) return []

    const multiSwap = true

    const contract: Contract | null = getSwapRouterContract(chainId, library, account)

    if (!contract) {
      return []
    }

    const swapMethods = []

    swapMethods.push(
      SwapRouter.swapCallParameters(trade, {
        feeOnTransfer: false,
        allowedSlippage: new Percent(BigNumber.from(allowedSlippage), BIPS_BASE),
        recipient,
        deadline: deadline.toNumber(),
        multiSwap,
        etherIn: input === NETWORK_CCY[chainId],
        etherOut: output === NETWORK_CCY[chainId]
      }),
    )

    if (trade.tradeType === SwapType.EXACT_INPUT) {
      swapMethods.push(
        SwapRouter.swapCallParameters(trade, {
          feeOnTransfer: true,
          allowedSlippage: new Percent(BigNumber.from(allowedSlippage), BIPS_BASE),
          recipient,
          deadline: deadline.toNumber(),
          multiSwap,
          etherIn: input === NETWORK_CCY[chainId],
          etherOut: output === NETWORK_CCY[chainId]
        }),
      )
    }

    return swapMethods.map((parameters) => ({ parameters, contract }))
  }, [account, allowedSlippage, chainId, deadline, library, recipient, trade, input, output])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapV3Callback(
  chainId: number,
  account: string,
  library: any,
  trade: Swap | undefined, // trade to execute, required
  input: Currency,
  output: Currency,
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapV3CallbackState; callback: null | (() => Promise<string>); error: string | null } {

  const gasPrice = useGasPrice(chainId)

  const swapCalls = useSwapV3CallArguments(chainId, account, library, trade, input, output, allowedSlippage, recipientAddressOrName)

  const addTransaction = useTransactionAdder()

  // const { address: recipientAddress } = useENS(chainId, recipientAddressOrName)
  const recipient = account // recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { state: SwapV3CallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapV3CallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      }
      return { state: SwapV3CallbackState.LOADING, callback: null, error: null }
    }

    return {
      state: SwapV3CallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
        const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
          swapCalls.map((call) => {
            const {
              parameters: { methodName, args, value },
              contract,
            } = call
            const options = !value || isZero(value) ? {} : { value }

            return contract.estimateGas[methodName](...args, options)
              .then((gasEstimate) => {
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch((gasError) => {
                console.error('Gas estimate failed, trying eth_call to extract error', call)

                return contract.callStatic[methodName](...args, options)
                  .then((result) => {
                    console.error('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
                  })
                  .catch((callError) => {
                    console.error('Call threw error', call, callError)
                    const reason: string = callError.reason || callError.data?.message || callError.message
                    const errorMessage = `The transaction cannot succeed due to error: ${reason ?? 'Unknown error, check the logs'
                      }.`

                    return { call, error: new Error(errorMessage) }
                  })
              })
          }),
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        const successfulEstimation = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1]),
        )

        if (!successfulEstimation) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          throw new Error('Unexpected error. Please contact support: none of the calls threw an error')
        }

        const {
          call: {
            contract,
            parameters: { methodName, args, value },
          },
          gasEstimate,
        } = successfulEstimation

        return contract[methodName](...args, {
          // gasLimit: calculateGasMargin(gasEstimate),
          // gasPrice,
          ...(value && !isZero(value) ? { value, from: account } : { from: account }),
        })
          .then((response: any) => {
            const inputSymbol = trade.inputAmount.currency.symbol
            const outputSymbol = trade.outputAmount.currency.symbol
            const inputAmount = trade.inputAmount.toSignificant(3)
            const outputAmount = trade.outputAmount.toSignificant(3)

            const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            const withRecipient =
              recipient === account
                ? base
                : `${base} to ${recipientAddressOrName && isAddress(recipientAddressOrName)
                  ? shortenAddress(recipientAddressOrName)
                  : recipientAddressOrName
                }`

            addTransaction(response, {
              summary: withRecipient,
            })

            return response.hash
          })
          .catch((error: any) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, methodName, args, value)
              throw new Error(`Swap failed: ${error.message}`)
            }
          })
      },
      error: null,
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransaction
    // , gasPrice
  ])
}
