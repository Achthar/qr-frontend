import { useCallback } from 'react'
import { claimReward } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useClaimRewards = (chainId: number) => {
  const bondContract = useBondContract(chainId)

  const handleClaim = useCallback(async () => {
    await claimReward(chainId, bondContract)
  }, [bondContract, chainId])

  return { onClaim: handleClaim }
}

export default useClaimRewards
