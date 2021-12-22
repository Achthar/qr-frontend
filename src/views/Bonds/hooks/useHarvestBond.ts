import { useCallback } from 'react'
import { harvestBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'

const useHarvestBond = (chainId: number, bondPid: number) => {
  const bondContract = useBondContract(chainId)

  const handleHarvest = useCallback(async () => {
    await harvestBond(bondContract, bondPid)
  }, [bondPid, bondContract])

  return { onReward: handleHarvest }
}

export default useHarvestBond
