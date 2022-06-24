import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import masterchefABI from 'config/abi/masterchef.json'
import multicall from 'utils/multicall'
import { getAddress, getBondingDepositoryAddress, getCallBondingDepositoryAddress, getMasterChefAddress } from 'utils/addressHelpers'
import { BondConfig } from 'config/constants/types'
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import callBondReserveAVAX from 'config/abi/avax/CallBondDepository.json'

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
  reward: string
}
// payout and interest fetch
export const fetchBondUserPendingPayoutData = async (chainId: number, account: string): Promise<BondUserData> => {

  const bondDepositoryAddress = getBondingDepositoryAddress(chainId)

  const callInfoIndexes = [{ address: bondDepositoryAddress, name: 'indexesFor', params: [account] }]

  // fetch indexres
  const indexes = await multicall(chainId, bondReserveAVAX, callInfoIndexes)
  console.log("NOTES INDEX", indexes[0][0])
  const cleanIndexes = indexes[0][0].map(_index => Number(_index.toString()))
  const callsInfo = cleanIndexes.map((index) => {
    return { address: bondDepositoryAddress, name: 'userTerms', params: [account, index] }
  })

  const results = await multicall(chainId, bondReserveAVAX, [...callsInfo, { address: bondDepositoryAddress, name: 'rewards', params: [account] }])

  const notes = results.slice(0, results.length - 1)

  return {
    notes: notes.map((note, index) => {
      return {
        payout: note.payout.toString(),
        created: Number(note.created),
        matured: Number(note.matured),
        redeemed: note.redeemed.toString(),
        marketId: Number(note.marketID),
        noteIndex: cleanIndexes[index]

      }
    }
    ),
    reward: results[results.length - 1].toString()
  }
}

// payout and interest fetch for call bond
export const fetchCallBondUserPendingPayoutData = async (chainId: number, account: string): Promise<BondUserData> => {

  const bondDepositoryAddress = getCallBondingDepositoryAddress(chainId)

  const callInfoIndexes = [{ address: bondDepositoryAddress, name: 'indexesFor', params: [account] }]

  // fetch indexres
  const indexes = await multicall(chainId, callBondReserveAVAX, callInfoIndexes)
  const cleanIndexes = indexes[0][0].map(_index => Number(_index.toString()))
  
  const callsInfo = cleanIndexes.map((index) => {
    return { address: bondDepositoryAddress, name: 'userTerms', params: [account, index] }
  })

  const results = await multicall(chainId, callBondReserveAVAX, [...callsInfo, { address: bondDepositoryAddress, name: 'rewards', params: [account] }])

  const notes = results.slice(0, results.length - 1)

  return {
    notes: notes.map((note, index) => {
      return {
        payout: note.payout.toString(),
        created: Number(note.created),
        matured: Number(note.matured),
        redeemed: note.redeemed.toString(),
        marketId: Number(note.marketID),
        noteIndex: cleanIndexes[index],
        cryptoIntitialPrice: note.cryptoIntitialPrice.toString()

      }
    }
    ),
    reward: results[results.length - 1].toString()
  }
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
  const parsedAllowance = rawData.slice(0, bondsToFetch.length).map((allowance) => {
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

// simple allowance fetch together with balances in multicall
export const fetchCallBondUserAllowancesAndBalances = async (chainId: number, account: string, bondsToFetch: BondConfig[]): Promise<BondTokenData> => {

  const bondDepositoryAddress = getCallBondingDepositoryAddress(chainId)

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
  const parsedAllowance = rawData.slice(0, bondsToFetch.length).map((allowance) => {
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