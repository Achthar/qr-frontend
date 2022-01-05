import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
// import masterchefABI_orig from 'config/abi/masterchef.json'
import requiemChefABI from 'config/abi/avax/RequiemChef.json'
import multicall from 'utils/multicall'
import { getAddress, getMasterChefAddress } from 'utils/addressHelpers'
import { SerializedFarmConfig } from 'config/constants/types'


export const fetchFarmUserAllowances = async (chainId: number, account: string, farmsToFetch: SerializedFarmConfig[]) => {
  const masterChefAddress = getMasterChefAddress(chainId)

  const calls = farmsToFetch.map((farm) => {
    const lpContractAddress = getAddress(chainId, farm.lpAddresses)
    return { address: lpContractAddress, name: 'allowance', params: [account, masterChefAddress] }
  })

  const rawLpAllowances = await multicall(chainId, erc20ABI, calls)
  const parsedLpAllowances = rawLpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance).toJSON()
  })
  return parsedLpAllowances
}

export const fetchFarmUserTokenBalances = async (chainId: number, account: string, farmsToFetch: SerializedFarmConfig[]) => {
  const calls = farmsToFetch.map((farm) => {
    const lpContractAddress = getAddress(chainId, farm.lpAddresses)
    return {
      address: lpContractAddress,
      name: 'balanceOf',
      params: [account],
    }
  })

  const rawTokenBalances = await multicall(chainId, erc20ABI, calls)
  const parsedTokenBalances = rawTokenBalances.map((tokenBalance) => {
    return new BigNumber(tokenBalance).toJSON()
  })
  return parsedTokenBalances
}

export const fetchFarmUserStakedBalances = async (chainId: number, account: string, farmsToFetch: SerializedFarmConfig[]) => {
  const masterChefAddress = getMasterChefAddress(chainId)

  const calls = farmsToFetch.map((farm) => {
    return {
      address: masterChefAddress,
      name: 'userInfo',
      params: [farm.pid, account],
    }
  })

  const rawStakedBalances = await multicall(chainId, requiemChefABI, calls)
  const parsedStakedBalances = rawStakedBalances.map((stakedBalance) => {
    return new BigNumber(stakedBalance[0]._hex).toJSON()
  })
  return parsedStakedBalances
}

export const fetchFarmUserEarnings = async (chainId:number, account: string, farmsToFetch: SerializedFarmConfig[]) => {
  const masterChefAddress = getMasterChefAddress(chainId)

  const calls = farmsToFetch.map((farm) => {
    return {
      address: masterChefAddress,
      name: 'pendingReward',
      params: [farm.pid, account],
    }
  })

  const rawEarnings = await multicall(chainId, requiemChefABI, calls)
  const parsedEarnings = rawEarnings.map((earnings) => {
    return new BigNumber(earnings).toJSON()
  })
  return parsedEarnings
}
