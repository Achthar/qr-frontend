import { useCallback } from 'react'
import { unstakeFarm } from 'utils/calls'
import { useMasterchef } from 'hooks/useContract'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

const useUnstakeFarms = (pid: number) => {
  const masterChefContract = useMasterchef()
  const { chainId, account } = useActiveWeb3React()

  const handleUnstake = useCallback(
    async (amount: string) => {
      await unstakeFarm(chainId, account, masterChefContract, pid, amount)
    },
    [masterChefContract, pid, chainId, account],
  )

  return { onUnstake: handleUnstake }
}

export default useUnstakeFarms
