import { useCallback } from 'react'
import { withdrawFromLock, emergencyWithdrawFromLock } from 'utils/calls'
import { useRedRequiemContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'
import { Lock } from 'state/governance/reducer'

export const useWithdrawFromLock = () => {
  const redReqContract = useRedRequiemContract()
  const { chainId } = useWeb3React()

  const handleWithdraw = useCallback(
    async (lock: Lock) => {
      await withdrawFromLock(chainId, redReqContract, lock)
    },
    [chainId, redReqContract],
  )

  return { onWithdraw: handleWithdraw }
}


export const useEmergencyWithdrawFromLock = () => {
  const redReqContract = useRedRequiemContract()
  const { chainId } = useWeb3React()

  const handleEmergencyWithdraw = useCallback(
    async (lock: Lock) => {
      await emergencyWithdrawFromLock(chainId, redReqContract, lock)
    },
    [chainId, redReqContract],
  )

  return { onEmergencyWithdraw: handleEmergencyWithdraw }
}
