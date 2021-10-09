import poolsConfig from 'config/constants/pools'
import sousChefABI from 'config/abi/sousChef.json'
import erc20ABI from 'config/abi/erc20.json'
import multicall from 'utils/multicall'
import { getMasterchefContract } from 'utils/contractHelpers'
import { getAddress } from 'utils/addressHelpers'
import { simpleRpcProvider } from 'utils/providers'
import BigNumber from 'bignumber.js'
import { NETWORK_CCY } from '@pancakeswap/sdk'

// Pool 0, Cake / Cake is a different kind of contract (master chef)
// BNB pools use the native BNB token (wrapping ? unwrapping is done at the contract level)
const nonBnbPools = poolsConfig.filter((p) => p.stakingToken.symbol !== 'BNB')
const bnbPools = poolsConfig.filter((p) => p.stakingToken.symbol === 'BNB')
const nonMasterPools = poolsConfig.filter((p) => p.sousId !== 0)

// sconst masterChefContract = getMasterchefContract()

export const fetchPoolsAllowance = async (chainId, account) => {
  const calls = nonBnbPools.map((p) => ({
    address: getAddress(chainId, p.stakingToken.address),
    name: 'allowance',
    params: [account, getAddress(chainId, p.contractAddress)],
  }))

  const allowances = await multicall(chainId, erc20ABI, calls)
  return nonBnbPools.reduce(
    (acc, pool, index) => ({ ...acc, [pool.sousId]: new BigNumber(allowances[index]).toJSON() }),
    {},
  )
}

export const fetchUserBalances = async (chainId, account) => {
  // Non BNB pools
  const calls = nonBnbPools.map((p) => ({
    address: getAddress(chainId, p.stakingToken.address),
    name: 'balanceOf',
    params: [account],
  }))
  const tokenBalancesRaw = await multicall(chainId, erc20ABI, calls)
  const tokenBalances = nonBnbPools.reduce(
    (acc, pool, index) => ({ ...acc, [pool.sousId]: new BigNumber(tokenBalancesRaw[index]).toJSON() }),
    {},
  )

  // BNB pools
  const bnbBalance = await simpleRpcProvider(chainId).getBalance(account)
  const bnbBalances = bnbPools.reduce(
    (acc, pool) => ({ ...acc, [pool.sousId]: new BigNumber(bnbBalance.toString()).toJSON() }),
    {},
  )

  return { ...tokenBalances, ...bnbBalances }
}

export const fetchUserStakeBalances = async (chainId, account) => {
  const calls = nonMasterPools.map((p) => ({
    address: getAddress(chainId, p.contractAddress),
    name: 'userInfo',
    params: [account],
  }))
  const userInfo = await multicall(chainId, sousChefABI, calls)
  const stakedBalances = nonMasterPools.reduce(
    (acc, pool, index) => ({
      ...acc,
      [pool.sousId]: new BigNumber(userInfo[index].amount._hex).toJSON(),
    }),
    {},
  )

  // Cake / Cake pool
  const { amount: masterPoolAmount } = await getMasterchefContract(chainId).userInfo('0', account)

  return { ...stakedBalances, 0: new BigNumber(masterPoolAmount.toString()).toJSON() }
}

export const fetchUserPendingRewards = async (chainId, account) => {
  const calls = nonMasterPools.map((p) => ({
    address: getAddress(chainId, p.contractAddress),
    name: 'pendingReward',
    params: [account],
  }))
  const res = await multicall(chainId, sousChefABI, calls)
  const pendingRewards = nonMasterPools.reduce(
    (acc, pool, index) => ({
      ...acc,
      [pool.sousId]: new BigNumber(res[index]).toJSON(),
    }),
    {},
  )

  // Cake / Cake pool
  const pendingReward = await getMasterchefContract(chainId).pendingCake('0', account)

  return { ...pendingRewards, 0: new BigNumber(pendingReward.toString()).toJSON() }
}
