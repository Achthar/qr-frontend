import { useCallback } from 'react'
import { stakeFarm } from 'utils/calls'
import { useMasterchef } from 'hooks/useContract'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

const useStakeFarms = (pid: number) => {
  const masterChefContract = useMasterchef()
  const { chainId, account } = useActiveWeb3React()
  const handleStake = useCallback(
    async (amount: string) => {
      const txHash = await stakeFarm(chainId, account, masterChefContract, pid, amount)
      console.info(txHash)
    },
    [masterChefContract, pid, chainId, account],
  )

  return { onStake: handleStake }
}

export default useStakeFarms
