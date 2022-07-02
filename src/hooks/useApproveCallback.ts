import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { TokenAmount, CurrencyAmount, NETWORK_CCY, Swap, Token, ZERO } from '@requiemswap/sdk'
import { useCallback, useEffect, useMemo } from 'react'
import { BigNumber, ethers } from 'ethers'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { SWAP_ROUTER } from '../config/constants'
import useTokenAllowance, { useTokenAllowances } from './useTokenAllowance'
import { Field } from '../state/swapV3/actions'
import ERC20_ABI from '../config/abi/erc20.json'
import { useTransactionAdder, useHasPendingApproval, useHasPendingApprovals } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { computeSlippageAdjustedAmountsV3 } from '../utils/pricesV3'
import { calculateGasMargin, getContract } from '../utils'
import { useTokenContract } from './useContract'
import { useCallWithGasPrice } from './useCallWithGasPrice'

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
  LOADING
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  chainId: number,
  account: string,
  amountToApprove?: CurrencyAmount,
  spender?: string,
): [ApprovalState, () => Promise<void>] {

  const { callWithGasPrice } = useCallWithGasPrice()
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined
  const currentAllowance = useTokenAllowance(chainId, token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(chainId, token?.address, spender)
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
// export function useApproveCallbackFromTrade(chainId: number, account: string, trade?: Trade, allowedSlippage = 0) {
//   const amountToApprove = useMemo(
//     () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
//     [trade, allowedSlippage],
//   )

//   return useApproveCallback(chainId, account, amountToApprove, ROUTER_ADDRESS[chainId])
// }


// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTradeV3(chainId: number, account: string, tradeV3?: Swap, allowedSlippage = 0, networkCcyIn = false) {
  const amountToApprove = useMemo(
    () => (tradeV3 ? computeSlippageAdjustedAmountsV3(tradeV3, allowedSlippage)[Field.INPUT] : undefined),
    [tradeV3, allowedSlippage],
  )
  const validatedIn = useMemo(() => amountToApprove && (networkCcyIn ? CurrencyAmount.networkCCYAmount(chainId, amountToApprove.raw) : amountToApprove), [chainId, networkCcyIn, amountToApprove])

  return useApproveCallback(
    chainId,
    account,
    validatedIn,
    SWAP_ROUTER[chainId]
  )
}



// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallbackWithAllowance(
  chainId: number,
  account: string,
  currentAllowance: string,
  amountToApprove?: CurrencyAmount,
  spender?: string,
): [ApprovalState, () => Promise<void>] {

  const { callWithGasPrice } = useCallWithGasPrice()
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined

  const pendingApproval = useHasPendingApproval(chainId, token?.address, spender)
  
  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency === NETWORK_CCY[chainId]) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return BigNumber.from(currentAllowance).lt(amountToApprove.toBigNumber())
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


// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallbacks(
  chainId: number,
  library: any,
  account: string,
  tokens: Token[],
  amountsToApprove?: TokenAmount[],
  spender?: string,
): { approvalStates: ApprovalState[], approveCallback: (index: number) => Promise<void>, isLoading: boolean } {

  const { callWithGasPrice } = useCallWithGasPrice()

  const { amounts: currentAllowances, isLoading } = useTokenAllowances(chainId, tokens, account ?? undefined, spender)

  const pendingApproval = useHasPendingApprovals(chainId, tokens?.map(a => a?.address), spender)
  // check the current approval status
  const approvalStates: ApprovalState[] = useMemo(() => {
    return currentAllowances?.map((currentAllowance, i) => {
      if (!amountsToApprove || !spender) return ApprovalState.UNKNOWN
      if (amountsToApprove[i]?.currency === NETWORK_CCY[chainId]) return ApprovalState.APPROVED
      // we might not have enough data to know whether or not we need to approve
      if (!currentAllowance) return ApprovalState.UNKNOWN

      // amountToApprove will be defined if currentAllowance is
      return currentAllowance && currentAllowance?.lessThan(amountsToApprove[i] ?? ZERO)
        ? pendingApproval[i]
          ? ApprovalState.PENDING
          : ApprovalState.NOT_APPROVED
        : ApprovalState.APPROVED
    }
    )
  }, [chainId, amountsToApprove, currentAllowances, pendingApproval, spender])

  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (index: number): Promise<void> => {
    const tokenContract = getContract(amountsToApprove[index]?.token?.address, new ethers.utils.Interface(ERC20_ABI), library, account)
    if (approvalStates[index] !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!amountsToApprove[index]) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountsToApprove) {
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
      return tokenContract.estimateGas.approve(spender, amountsToApprove[index].raw.toString())
    })

    // eslint-disable-next-line consistent-return
    return callWithGasPrice(
      tokenContract,
      'approve',
      [spender, useExact ? amountsToApprove[index].raw.toString() : MaxUint256],
      {
        gasLimit: calculateGasMargin(estimatedGas),
      },
    )
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: `Approve ${amountsToApprove[index].currency.symbol}`,
          approval: { tokenAddress: amountsToApprove[index].token.address, spender },
        })
      })
      .catch((error: Error) => {
        console.error('Failed to approve token', error)
        throw error
      })
  }, [approvalStates, amountsToApprove, spender, addTransaction, callWithGasPrice, account, library])

  return { approvalStates, approveCallback: approve, isLoading }
}