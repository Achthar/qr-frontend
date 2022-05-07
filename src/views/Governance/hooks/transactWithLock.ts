import { useCallback } from 'react'
import { createLock, increaseMaturity, increasePosition } from 'utils/calls'
import { useRedRequiemContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'
import { Lock } from 'state/governance/reducer'

export const useCreateLock = () => {
  const redReqContract = useRedRequiemContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string, end: number) => {
      await createLock(chainId, account, amount, end, redReqContract)
    },
    [chainId, redReqContract, account],
  )

  return { onCreateLock: func }
}


export const useIncreasePosition = () => {
  const redReqContract = useRedRequiemContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string, lock: Lock) => {
      await increasePosition(chainId, account, amount, redReqContract, lock)
    },
    [chainId, redReqContract, account],
  )

  return { onIncreasePosition: func }
}

export const useIncreaseMaturity = () => {
  const redReqContract = useRedRequiemContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string, newEnd: number, lock: Lock) => {
      await increaseMaturity(chainId, account, amount, newEnd, redReqContract, lock)
    },
    [chainId, redReqContract, account],
  )

  return { onIncreaseMaturity: func }
}

