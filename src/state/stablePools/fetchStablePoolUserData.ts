import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import masterchefABI from 'config/abi/masterchef.json'
import multicall from 'utils/multicall'
import { getAddress, getBondingDepositoryAddress, getMasterChefAddress, getStableSwapAddress } from 'utils/addressHelpers'
import { BondConfig } from 'config/constants/types'
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import { JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";
import { getContractForReserve } from 'utils/contractHelpers'
import { StablePoolConfig } from 'state/types'

// simple allowance fetch
export const fetchStablePoolData = async (chainId: number, account: string, pools: StablePoolConfig[]) => {

  const calls = pools.map((pool) => {
    const lpContractAddress = pool.lpAddress
    return { address: lpContractAddress, name: 'allowance', params: [account, getStableSwapAddress(chainId)] }
  })

  const rawLpAllowances = await multicall(chainId, erc20ABI, calls)
  const parsedLpAllowances = rawLpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance).toJSON()
  })

  return parsedLpAllowances
}

export interface StablePoolUserData {
  allowances: any
  balances: any
}

// simple allowance fetch together with balances in multicall
export const fetchPoolUserAllowancesAndBalances = async (chainId: number, account: string, poolsToFetch: StablePoolConfig[]): Promise<StablePoolUserData> => {

  const callsAllowance = poolsToFetch.map((pool) => {
    const lpContractAddress = pool.lpAddress
    return { address: lpContractAddress, name: 'allowance', params: [account, pool.address] }
  })

  const callsLpBalances = poolsToFetch.map((pool) => {
    const lpContractAddress = pool.lpAddress
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
