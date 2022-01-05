import { useCallback } from 'react'
import { unstakeFarm } from 'utils/calls'
import { useMasterchef } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'

const useUnstakeFarms = (pid: number) => {
  const masterChefContract = useMasterchef()
  const { chainId, account } = useWeb3React()

  const handleUnstake = useCallback(
    async (amount: string) => {
      await unstakeFarm(chainId, account, masterChefContract, pid, amount)
    },
    [masterChefContract, pid, chainId, account],
  )

  return { onUnstake: handleUnstake }
}

export default useUnstakeFarms
