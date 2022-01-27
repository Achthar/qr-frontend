import { useCallback } from 'react'
import { harvestBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useHarvestBond = (chainId: number, bond: BondConfig) => {
  const bondContract = useBondContract(chainId, bond)

  const handleHarvest = useCallback(async () => {
    await harvestBond(bondContract, bond.bondId)
  }, [bond.bondId, bondContract])

  return { onReward: handleHarvest }
}

export default useHarvestBond
