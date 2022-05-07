import { useCallback } from 'react'
import { harvestFarm } from 'utils/calls'
import { useMasterchef, useRequiemChef } from 'hooks/useContract'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

const useHarvestFarm = (farmPid: number) => {
  const { chainId, account } = useActiveWeb3React()
  const masterChefContract = useMasterchef()

  const handleHarvest = useCallback(async () => {
    await harvestFarm(chainId, account, masterChefContract, farmPid)
  }, [farmPid, masterChefContract, chainId, account])

  return { onReward: handleHarvest }
}

export default useHarvestFarm
