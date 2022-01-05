import { useCallback } from 'react'
import { stakeFarm } from 'utils/calls'
import { useMasterchef } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'

const useStakeFarms = (pid: number) => {
  const masterChefContract = useMasterchef()
  const { chainId, account } = useWeb3React()
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
