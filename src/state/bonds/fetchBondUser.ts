import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import masterchefABI from 'config/abi/masterchef.json'
import multicall from 'utils/multicall'
import { getAddress, getBondingDepositoryAddress, getMasterChefAddress } from 'utils/addressHelpers'
import { BondConfig } from 'config/constants/types'
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import { JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";
import { getContractForReserve } from 'utils/contractHelpers'

// simple allowance fetch
export const fetchBondUserAllowances = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {

  const bondDepositoryAddress = getBondingDepositoryAddress(chainId)
  const calls = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
    return { address: lpContractAddress, name: 'allowance', params: [account, bondDepositoryAddress] }
  })

  const rawLpAllowances = await multicall(chainId, erc20ABI, calls)
  const parsedLpAllowances = rawLpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance).toJSON()
  })

  return parsedLpAllowances
}


export interface BondUserData {
  notes: any[]
}
// payout and interest fetch
export const fetchBondUserPendingPayoutData = async (chainId: number, account: string, bondsToFetch: BondConfig[]): Promise<BondUserData> => {

  const bondDepositoryAddress = getBondingDepositoryAddress(chainId)

  const callsInfo = bondsToFetch.map((bond) => {
    return { address: bondDepositoryAddress, name: 'notes', params: [account, bond.bondId] }
  })

  const notes = await multicall(chainId, bondReserveAVAX, callsInfo)


  return {
    notes
  }
}

// TODO (appleseed): improve this logic
export const getBondReservePrice = async (bond: BondConfig, chainId: number, provider: StaticJsonRpcProvider | JsonRpcSigner) => {
  let marketPrice: number;
  if (bond.isLP) {
    const pairContract = getContractForReserve(chainId, bond, provider);
    const reserves = await pairContract.getReserves();
    marketPrice = Number(reserves[1].toString()) / Number(reserves[0].toString()) / 10 ** 9;
  } else {
    marketPrice = 10;
  }
  return marketPrice;
}

export const fetchBondUserTokenBalances = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {
  const calls = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
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


export interface BondTokenData {
  allowances: any
  balances: any
}

// simple allowance fetch together with balances in multicall
export const fetchBondUserAllowancesAndBalances = async (chainId: number, account: string, bondsToFetch: BondConfig[]): Promise<BondTokenData> => {

  const bondDepositoryAddress = getBondingDepositoryAddress(chainId)

  const callsAllowance = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
    return { address: lpContractAddress, name: 'allowance', params: [account, bondDepositoryAddress] }
  })

  const callsBalances = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
    return {
      address: lpContractAddress,
      name: 'balanceOf',
      params: [account],
    }
  })

  const rawData = await multicall(chainId, erc20ABI, [...callsAllowance, ...callsBalances])
  const parsedAllowance = rawData.slice(bondsToFetch.length).map((allowance) => {
    return new BigNumber(allowance).toJSON()
  })

  const balances = rawData.slice(bondsToFetch.length, rawData.length).map((balance) => {
    return new BigNumber(balance).toJSON()
  })
  return {
    allowances: parsedAllowance,
    balances
  }
}


export const fetchBondUserStakedBalances = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {
  const masterChefAddress = 'getAddressForBond(chainId)'

  const calls = bondsToFetch.map((bond) => {
    return {
      address: masterChefAddress,
      name: 'userInfo',
      params: [bond.bondId, account],
    }
  })

  const rawStakedBalances = await multicall(chainId, masterchefABI, calls)
  const parsedStakedBalances = rawStakedBalances.map((stakedBalance) => {
    return new BigNumber(stakedBalance[0]._hex).toJSON()
  })
  return parsedStakedBalances
}