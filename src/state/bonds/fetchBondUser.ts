import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import masterchefABI from 'config/abi/masterchef.json'
import multicall from 'utils/multicall'
import { getAddress, getAddressForBond, getMasterChefAddress } from 'utils/addressHelpers'
import { BondConfig } from 'config/constants/types'
import bondReserveAVAX from 'config/abi/avax/RequiemQBondDepository.json'
import { JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";
import { getContractForReserve } from 'utils/contractHelpers'

// simple allowance fetch
export const fetchBondUserAllowances = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {

  const calls = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
    const bondDepositoryAddress = getAddressForBond(chainId, bond)
    return { address: lpContractAddress, name: 'allowance', params: [account, bondDepositoryAddress] }
  })

  const rawLpAllowances = await multicall(chainId, erc20ABI, calls)
  const parsedLpAllowances = rawLpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance).toJSON()
  })

  return parsedLpAllowances
}


export interface BondUserData {
  pendingPayout: BigNumber[]
  bondInfo: any[]
}
// payout and interest fetch
export const fetchBondUserPendingPayoutData = async (chainId: number, account: string, bondsToFetch: BondConfig[]): Promise<BondUserData> => {

  const calls = bondsToFetch.map((bond) => {
    const bondDepositoryAddress = getAddressForBond(chainId, bond)
    return { address: bondDepositoryAddress, name: 'pendingPayoutFor', params: [account] }
  })

  const callsInfo = bondsToFetch.map((bond) => {
    const bondDepositoryAddress = getAddressForBond(chainId, bond)
    return { address: bondDepositoryAddress, name: 'bondInfo', params: [account] }
  })

  const rawData = await multicall(chainId, bondReserveAVAX, [...calls, ...callsInfo])

  const parsedPayoff = rawData.slice(calls.length - 1).map((lpBalance) => {
    return new BigNumber(lpBalance[0].toString()).toJSON()
  })

  const parsedInfo = rawData.slice(-calls.length)

  return {
    pendingPayout: parsedPayoff,
    bondInfo: parsedInfo
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

  const callsAllowance = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
    const bondDepositoryAddress = getAddressForBond(chainId, bond)
    return { address: lpContractAddress, name: 'allowance', params: [account, bondDepositoryAddress] }
  })

  const callsBalances = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
    const bondDepositoryAddress = getAddressForBond(chainId, bond)
    return {
      address: lpContractAddress,
      name: 'balanceOf',
      params: [account],
    }
  })

  const rawData = await multicall(chainId, erc20ABI, [...callsAllowance, ...callsBalances])

  const parsedAllowance = rawData.slice(callsAllowance.length - 1).map((allowance) => {
    return new BigNumber(allowance).toJSON()
  })

  const parsedPayoff = rawData.slice(-callsAllowance.length).map((payoff) => {
    return new BigNumber(payoff).toJSON()
  })

  return {
    allowances: parsedAllowance,
    balances: parsedPayoff
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

// export const fetchBondUserEarnings = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {
//   const masterChefAddress = getMasterChefAddress(chainId)

//   const calls = bondsToFetch.map((bond) => {
//     return {
//       address: masterChefAddress,
//       name: 'pendingReqt',
//       params: [bond.bondId, account],
//     }
//   })

//   const rawEarnings = await multicall(chainId, masterchefABI, calls)
//   const parsedEarnings = rawEarnings.map((earnings) => {
//     return new BigNumber(earnings).toJSON()
//   })
//   return parsedEarnings
// }
