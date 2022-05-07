import { useCallback } from 'react'
import { stake, unstake, wrap, unwrap } from 'utils/calls'
import { useAssetBackedStakingContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'

export const useStake = () => {
  const stakingContract = useAssetBackedStakingContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await stake(chainId, stakingContract, account, amount, 0, 1)
    },
    [chainId, stakingContract, account],
  )

  return { onStake: func }
}


export const useUnstake = () => {
  const stakingContract = useAssetBackedStakingContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await unstake(chainId, stakingContract, account, amount, 0, 1)
    },
    [chainId, stakingContract, account],
  )

  return { onUnstake: func }
}

export const useWrap = () => {
  const stakingContract = useAssetBackedStakingContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await wrap(chainId, stakingContract, amount, account)
    },
    [chainId, stakingContract, account],
  )

  return { onWrap: func }
}

export const useUnwrap = () => {
  const stakingContract = useAssetBackedStakingContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await unwrap(chainId, stakingContract, amount, account)
    },
    [chainId, stakingContract, account],
  )

  return { onUnwrap: func }
}



