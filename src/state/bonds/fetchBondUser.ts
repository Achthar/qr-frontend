import BigNumber from 'bignumber.js'
import erc20ABI from 'config/abi/erc20.json'
import masterchefABI from 'config/abi/masterchef.json'
import multicall from 'utils/multicall'
import { getAddress, getBondingDepositoryAddress, getCallableBondingDepositoryAddress, getCallBondingDepositoryAddress } from 'utils/addressHelpers'
import { BondConfig } from 'config/constants/types'
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import callBondReserveAVAX from 'config/abi/avax/CallBondDepository.json'
import callableBondReserveAVAX from 'config/abi/avax/CallableBondDepository.json'

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

export interface CallBondUserData {
  notes: any[]
  reward: string
}
// payout and interest fetch for call bond
export const fetchCallBondUserPendingPayoutData = async (chainId: number, account: string): Promise<CallBondUserData> => {

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

// payout and interest fetch for call bond
export const fetchCallableBondUserPendingPayoutData = async (chainId: number, account: string): Promise<CallBondUserData> => {

  const bondDepositoryAddress = getCallableBondingDepositoryAddress(chainId)

  const callInfoIndexes = [{ address: bondDepositoryAddress, name: 'indexesFor', params: [account] }]

  // fetch indexres
  const indexes = await multicall(chainId, callableBondReserveAVAX, callInfoIndexes)
  const cleanIndexes = indexes[0][0].map(_index => Number(_index.toString()))

  const callsInfo = cleanIndexes.map((index) => {
    return { address: bondDepositoryAddress, name: 'userTerms', params: [account, index] }
  })

  const results = await multicall(chainId, callableBondReserveAVAX, [...callsInfo, { address: bondDepositoryAddress, name: 'rewards', params: [account] }])

  const notes = results.slice(0, results.length - 1)

  return {
    notes: notes.map((note, index) => {
      return {
        payout: note.payout.toString(),
        created: Number(note.created),
        matured: Number(note.matured),
        exercised: Number(note.exercised.toString()),
        marketId: Number(note.marketID),
        noteIndex: cleanIndexes[index],
        cryptoIntitialPrice: note.cryptoIntitialPrice.toString()

      }
    }
    ),
    reward: results[results.length - 1].toString()
  }
}

export interface ClosedBonds {
  closedVanillaMarkets: any[]
  closedCallMarkets: any[]
  closedVanillaTerms: any[]
  closedCallTerms: any[]
  closedCallableMarkets: any[]
  closedCallableTerms: any[]
}

export const fetchUserClosedMarkets = async (chainId: number, bIds: number[], bidsCall: number[], bidsCallable: number[]): Promise<ClosedBonds> => {

  // vanilla
  const bondDepositoryAddress = getBondingDepositoryAddress(chainId)
  const calls = bIds.map((bi) => {
    return { address: bondDepositoryAddress, name: 'markets', params: [bi] }
  })

  const callsTerms = bIds.map((bi) => {
    return { address: bondDepositoryAddress, name: 'terms', params: [bi] }
  })

  // call
  const callBondDepositoryAddress = getCallBondingDepositoryAddress(chainId)
  const callsC = bidsCall.map((biC) => {
    return { address: callBondDepositoryAddress, name: 'markets', params: [biC] }
  })
  const callsCTerms = bidsCall.map((biC) => {
    return { address: callBondDepositoryAddress, name: 'terms', params: [biC] }
  })

  // callable
  const callableBondDepositoryAddress = getCallableBondingDepositoryAddress(chainId)
  const callsCallable = bidsCall.map((biC) => {
    return { address: callableBondDepositoryAddress, name: 'markets', params: [biC] }
  })
  const callsCallableTerms = bidsCall.map((biC) => {
    return { address: callableBondDepositoryAddress, name: 'terms', params: [biC] }
  })


  let resultsVanilla = []
  if (bIds.length > 0)
    resultsVanilla = await multicall(chainId, bondReserveAVAX, [...calls, ...callsTerms])

  let resultsCall = []

  if (bidsCall.length > 0)
    resultsCall = await multicall(chainId, callBondReserveAVAX, [...callsC, ...callsCTerms])

  let resultsCallable = []

  if (bidsCallable.length > 0)
    resultsCallable = await multicall(chainId, callableBondReserveAVAX, [...callsCallable, ...callsCallableTerms])


  return {
    closedVanillaMarkets: resultsVanilla.slice(0, calls.length),
    closedVanillaTerms: resultsVanilla.slice(calls.length, resultsVanilla.length),
    closedCallMarkets: resultsCall.slice(0, callsC.length),
    closedCallTerms: resultsCall.slice(callsC.length, resultsCall.length),
    closedCallableMarkets: resultsCallable.slice(0, callsCallable.length),
    closedCallableTerms: resultsCallable.slice(callsCallable.length, resultsCallable.length),
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



// simple allowance fetch together with balances in multicall
export const fetchCallableBondUserAllowancesAndBalances = async (chainId: number, account: string, bondsToFetch: BondConfig[]): Promise<BondTokenData> => {

  const bondDepositoryAddress = getCallableBondingDepositoryAddress(chainId)

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
