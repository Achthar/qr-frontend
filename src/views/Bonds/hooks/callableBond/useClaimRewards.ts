import { useCallback } from 'react'
import { claimCallReward } from 'utils/calls'
import { useCallableBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useClaimRewards = (chainId: number) => {
  const bondContract = useCallableBondContract(chainId)

  const handleClaim = useCallback(async () => {
    await claimCallReward(chainId, bondContract)
  }, [bondContract, chainId])

  return { onClaim: handleClaim }
}

export default useClaimRewards
