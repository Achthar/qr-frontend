import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import multicall from 'utils/multicall'
import { PoolConfig } from 'state/types'

// simple allowance fetch
export const fetchWeightePoolData = async (chainId: number, account: string, pools: PoolConfig[]) => {

  const calls = pools.map((pool) => {
    const lpContractAddress = pool.lpAddress
    return { address: lpContractAddress, name: 'allowance', params: [account, pool.address] }
  })

  const rawLpAllowances = await multicall(chainId, erc20ABI, calls)
  const parsedLpAllowances = rawLpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance).toJSON()
  })

  return parsedLpAllowances
}

export interface WeightePoolUserData {
  allowances: any
  balances: any
}

// simple allowance fetch together with balances in multicall
export const fetchPoolUserAllowancesAndBalances = async (chainId: number, account: string, poolsToFetch: PoolConfig[]): Promise<WeightePoolUserData> => {

  const callsAllowance = poolsToFetch.map((pool) => {
    const lpContractAddress = pool.address
    return { address: lpContractAddress, name: 'allowance', params: [account, pool.address] }
  })

  const callsLpBalances = poolsToFetch.map((pool) => {
    const lpContractAddress = pool.address
    return {
      address: lpContractAddress,
      name: 'balanceOf',
      params: [account],
    }
  })

  const rawData = await multicall(chainId, erc20ABI, [...callsAllowance, ...callsLpBalances])
  const parsedAllowance = rawData.slice(poolsToFetch.length).map((allowance) => {
    return new BigNumber(allowance).toJSON()
  })

  const balances = rawData.slice(poolsToFetch.length, rawData.length).map((balance) => {
    return new BigNumber(balance).toJSON()
  })
  return {
    allowances: parsedAllowance,
    balances
  }
}
