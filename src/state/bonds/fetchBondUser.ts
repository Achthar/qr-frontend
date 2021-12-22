import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import masterchefABI from 'config/abi/masterchef.json'
import multicall from 'utils/multicall'
import { getAddress, getAddressForBond, getMasterChefAddress } from 'utils/addressHelpers'
import { BondConfig } from 'config/constants/types'
import { JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";
import { getContractForReserve } from 'utils/contractHelpers'

export const fetchBondUserAllowances = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {
  const masterChefAddress = getAddressForBond(chainId)

  const calls = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.reserveAddress)
    return { address: lpContractAddress, name: 'allowance', params: [account, masterChefAddress] }
  })

  const rawLpAllowances = await multicall(chainId, erc20ABI, calls)
  const parsedLpAllowances = rawLpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance).toJSON()
  })
  return parsedLpAllowances
}

// TODO (appleseed): improve this logic
export const getBondReservePrice = async (bond: BondConfig, chainId: number, provider: StaticJsonRpcProvider | JsonRpcSigner) => {
  let marketPrice: number;
  if (bond.isLP) {
    const pairContract = getContractForReserve(chainId, provider);
    const reserves = await pairContract.getReserves();
    marketPrice = Number(reserves[1].toString()) / Number(reserves[0].toString()) / 10 ** 9;
  } else {
    marketPrice = 10;
  }
  return marketPrice;
}

export const fetchBondUserTokenBalances = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {
  const calls = bondsToFetch.map((bond) => {
    const lpContractAddress = getAddress(chainId, bond.bondAddress)
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

export const fetchBondUserStakedBalances = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {
  const masterChefAddress = getAddressForBond(chainId)

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

export const fetchBondUserEarnings = async (chainId: number, account: string, bondsToFetch: BondConfig[]) => {
  const masterChefAddress = getMasterChefAddress(chainId)

  const calls = bondsToFetch.map((bond) => {
    return {
      address: masterChefAddress,
      name: 'pendingReqt',
      params: [bond.bondId, account],
    }
  })

  const rawEarnings = await multicall(chainId, masterchefABI, calls)
  const parsedEarnings = rawEarnings.map((earnings) => {
    return new BigNumber(earnings).toJSON()
  })
  return parsedEarnings
}
