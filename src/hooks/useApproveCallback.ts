import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { Trade, TokenAmount, CurrencyAmount, NETWORK_CCY, TradeV4 } from '@requiemswap/sdk'
import { useCallback, useMemo } from 'react'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { ROUTER_ADDRESS, REQUIEMQROUTER_ADDRESS } from '../config/constants'
import useTokenAllowance from './useTokenAllowance'
import { Field } from '../state/swap/actions'
import { useTransactionAdder, useHasPendingApproval } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { computeSlippageAdjustedAmountsV3 } from '../utils/pricesV3'
import { calculateGasMargin } from '../utils'
import { useTokenContract } from './useContract'
import { useCallWithGasPrice } from './useCallWithGasPrice'

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  chainId: number,
  amountToApprove?: CurrencyAmount,
  spender?: string,
): [ApprovalState, () => Promise<void>] {
  const { account } = useActiveWeb3React()
  const { callWithGasPrice } = useCallWithGasPrice()
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined
  const currentAllowance = useTokenAllowance(chainId, token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency === NETWORK_CCY[chainId]) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [chainId, amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false

    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.raw.toString())
    })

    // eslint-disable-next-line consistent-return
    return callWithGasPrice(
      tokenContract,
      'approve',
      [spender, useExact ? amountToApprove.raw.toString() : MaxUint256],
      {
        gasLimit: calculateGasMargin(estimatedGas),
      },
    )
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: `Approve ${amountToApprove.currency.symbol}`,
          approval: { tokenAddress: token.address, spender },
        })
      })
      .catch((error: Error) => {
        console.error('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction, callWithGasPrice])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(chainId: number, trade?: Trade, allowedSlippage = 0) {
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage],
  )

  return useApproveCallback(chainId, amountToApprove, ROUTER_ADDRESS[chainId])
}


// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTradeV3(chainId: number, tradeV3?: TradeV4, allowedSlippage = 0) {
  const amountToApprove = useMemo(
    () => (tradeV3 ? computeSlippageAdjustedAmountsV3(tradeV3, allowedSlippage)[Field.INPUT] : undefined),
    [tradeV3, allowedSlippage],
  )

  return useApproveCallback(
    chainId,
    amountToApprove,
    REQUIEMQROUTER_ADDRESS[chainId]
  )
}