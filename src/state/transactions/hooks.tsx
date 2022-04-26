import { TransactionResponse } from '@ethersproject/providers'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { AppDispatch, AppState } from '../index'
import { addTransaction } from './actions'
import { TransactionDetails } from './reducer'

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  customData?: {
    summary?: string
    approval?: { tokenAddress: string; spender: string }
    claim?: { recipient: string }
  },
) => void {
  const { chainId, account } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (
      response: TransactionResponse,
      {
        summary,
        approval,
        claim,
      }: { summary?: string; claim?: { recipient: string }; approval?: { tokenAddress: string; spender: string } } = {},
    ) => {
      if (!account) return
      if (!chainId) return

      const { hash } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({ hash, from: account, chainId, approval, summary, claim }))
    },
    [dispatch, chainId, account],
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(chainId: number): { [txHash: string]: TransactionDetails } {

  const state = useSelector<AppState, AppState['transactions']>((s) => s.transactions)

  return chainId ? state[chainId] ?? {} : {}
}

export function useIsTransactionPending(chainId: number, transactionHash?: string): boolean {
  const transactions = useAllTransactions(chainId)

  if (!transactionHash || !transactions[transactionHash]) return false

  return !transactions[transactionHash].receipt
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(chainId: number, tokenAddress: string | undefined, spender: string | undefined): boolean {
  const allTransactions = useAllTransactions(chainId)
  return useMemo(
    () =>
      typeof tokenAddress === 'string' &&
      typeof spender === 'string' &&
      Object.keys(allTransactions).some((hash) => {
        const tx = allTransactions[hash]
        if (!tx) return false
        if (tx.receipt) {
          return false
        }
        const { approval } = tx
        if (!approval) return false
        return approval.spender === spender && approval.tokenAddress === tokenAddress && isTransactionRecent(tx)
      }),
    [allTransactions, spender, tokenAddress],
  )
}

// returns whether a token has a pending approval transaction
export function useHasPendingApprovals(chainId: number, tokenAddresses: (string | undefined)[], spender: string | undefined): boolean[] {
  const allTransactions = useAllTransactions(chainId)
  return useMemo(
    () => {
      return tokenAddresses?.map(tokenAddress => {
        return typeof tokenAddress === 'string' &&
          typeof spender === 'string' &&
          Object.keys(allTransactions).some((hash) => {
            const tx = allTransactions[hash]
            if (!tx) return false
            if (tx.receipt) {
              return false
            }
            const { approval } = tx
            if (!approval) return false
            return approval.spender === spender && approval.tokenAddress === tokenAddress && isTransactionRecent(tx)
          }
          )
      }
      )
    },
    [allTransactions, spender, tokenAddresses],
  )
}
