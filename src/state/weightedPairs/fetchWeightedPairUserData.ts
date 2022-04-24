import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import multicall from 'utils/multicall'
import { PoolConfig } from 'state/types'


export interface WeightedPairUserData {
  allowances: any
  balances: any
}

// simple allowance fetch together with balances in multicall
export const fetchPoolUserAllowancesAndBalances = async (chainId: number, account: string, pairsToFetch: PoolConfig[]): Promise<WeightedPairUserData> => {

  const callsAllowance = pairsToFetch.map((pool) => {
    const lpContractAddress = pool.lpAddress
    return { address: lpContractAddress, name: 'allowance', params: [account, pool.address] }
  })

  const callsLpBalances = pairsToFetch.map((pool) => {
    const lpContractAddress = pool.lpAddress
    return {
      address: lpContractAddress,
      name: 'balanceOf',
      params: [account],
    }
  })

  const rawData = await multicall(chainId, erc20ABI, [...callsAllowance, ...callsLpBalances])
  const allowances = rawData.slice(pairsToFetch.length).map((allowance) => {
    return new BigNumber(allowance).toJSON()
  })

  const balances = rawData.slice(pairsToFetch.length, rawData.length).map((balance) => {
    return new BigNumber(balance).toJSON()
  })
  return {
    allowances,
    balances
  }
}
