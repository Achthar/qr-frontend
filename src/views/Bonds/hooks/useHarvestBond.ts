import { useCallback } from 'react'
import { harvestBond } from 'utils/calls'
import { useMasterchef } from 'hooks/useContract'

const useHarvestBond = (bondPid: number) => {
  const masterChefContract = useMasterchef()

  const handleHarvest = useCallback(async () => {
    await harvestBond(masterChefContract, bondPid)
  }, [bondPid, masterChefContract])

  return { onReward: handleHarvest }
}

export default useHarvestBond
