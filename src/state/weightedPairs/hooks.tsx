import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import { Token, TokenAmount, AmplifiedWeightedPair } from '@requiemswap/sdk'
import { SerializedToken, TokenPair } from 'config/constants/types'
import { State, SerializedWeightedPair } from '../types'

/**
 * Fetches the whole state
 */

export const useWeightedPairsState = (chainId: number) => {
  const pairState = useSelector((state: State) => state.weightedPairs)
  return pairState[chainId]
}


export const deserializeWeightedPair = (tokenPair: TokenPair, pair: SerializedWeightedPair) => {
  if (!pair) return undefined
  return new AmplifiedWeightedPair(
    [
      new Token(
        tokenPair.token0.chainId,
        tokenPair.token0.address,
        tokenPair.token0.decimals,
        tokenPair.token0.symbol,
        tokenPair.token0.name
      ),
      new Token(
        tokenPair.token1.chainId,
        tokenPair.token1.address,
        tokenPair.token1.decimals,
        tokenPair.token1.symbol,
        tokenPair.token1.name
      )],
    [BigNumber.from(pair.reserve0), BigNumber.from(pair.reserve1)],
    [BigNumber.from(pair.vReserve0), BigNumber.from(pair.vReserve1)],
    BigNumber.from(pair.weight0),
    BigNumber.from(pair.fee),
    BigNumber.from(pair.amp),
    pair.address
  )
}

// returns all pairs as SDK Pair object
// requires everything to be loaded, otherwise the result
// will be an empty array
export const useDeserializedWeightedPairs = (chainId: number): AmplifiedWeightedPair[] => {
  const pairState = useSelector((state: State) => state.weightedPairs)[chainId]
  if (!pairState.metaDataLoaded || !pairState.reservesAndWeightsLoaded)
    return []

  let rawPairs = []
  const keys = Object.keys(pairState.weightedPairs)
  for (let i = 0; i < keys.length; i++)
    rawPairs = [...rawPairs, ...Object.values(pairState.weightedPairs[keys[i]])]

  return rawPairs.map(pair => deserializeWeightedPair(null, pair)
  )
}


// returns all pairs as SDK Pair object
// requires everything to be loaded, otherwise the result
// will be an empty array
export const useDeserializedWeightedPairsAndLpBalances = (chainId: number): { pairs: AmplifiedWeightedPair[], balances: TokenAmount[], totalSupply: TokenAmount[] } => {
  const pairState = useSelector((state: State) => state.weightedPairs)[chainId]
  if (!pairState.metaDataLoaded || !pairState.reservesAndWeightsLoaded)
    return { pairs: [], balances: [], totalSupply: [] }

  let rawPairs = []
  let rawTokens = []
  const pairs = []
  const keys = Object.keys(pairState.weightedPairs).sort()
  for (let i = 0; i < keys.length; i++) {
    rawPairs = [...rawPairs, ...Object.values(pairState.weightedPairs[keys[i]])]
    rawTokens = [...rawTokens, ...Object.values(pairState.weightedPairs[keys[i]]).map((_, j) =>
      pairState.tokenPairs.find(x => x.token0.address === keys[i].split('-')[0] && x.token1.address === keys[i].split('-')[1])
    )]
  }

  for (let i = 0; i < rawTokens.length; i++) {
    if (rawTokens[i]) {
      pairs.push(deserializeWeightedPair({ token0: rawTokens[i].token0, token1: rawTokens[i].token1 }, rawPairs[i]))
    }
  }
  return {
    pairs,
    balances: rawPairs.map(pair => new TokenAmount(new Token(chainId, pair.address, 18, ``, 'RLP'), pair.userData?.balance ?? '0')),
    totalSupply: rawPairs.map(pair => new TokenAmount(new Token(chainId, pair.address, 18, ``, 'RLP'), pair?.totalSupply ?? '0'))
  }

}

// returns all pairs as SDK Pair object
// requires everything to be loaded, otherwise the result
// will be an empty array
export const useDeserializedWeightedPairsData = (chainId: number): { pairs: AmplifiedWeightedPair[] } => {
  const pairState = useSelector((state: State) => state.weightedPairs)[chainId]
  if (!pairState.metaDataLoaded || !pairState.reservesAndWeightsLoaded)
    return { pairs: [] }

  let rawPairs = []
  let rawTokens = []
  const pairs = []
  const keys = Object.keys(pairState.weightedPairs).sort()
  for (let i = 0; i < keys.length; i++) {
    rawPairs = [...rawPairs, ...Object.values(pairState.weightedPairs[keys[i]])]
    rawTokens = [...rawTokens, ...Object.values(pairState.weightedPairs[keys[i]]).map(pair => { return { token0: pair.token0, token1: pair.token1 } })]
  }

  for (let i = 0; i < rawTokens.length; i++) {
    if (rawTokens[i]) {
      pairs.push(deserializeWeightedPair({ token0: rawTokens[i].token0, token1: rawTokens[i].token1 }, rawPairs[i]))
    }
  }
  return {
    pairs
  }

}

function generateTokenDict(serializedTokens: SerializedToken[]): { [id: number]: Token } {
  return Object.assign({},
    ...Object.values(serializedTokens).map(
      (x, index) => ({ [index]: new Token(x.chainId, x.address, x.decimals, x.symbol, x.name) })
    )
  )
}

export function usePairIsInState(chainId: number, tokenPair: TokenPair): boolean {
  const tokenPairs = useSelector((state: State) => state.weightedPairs[chainId].tokenPairs)

  return useMemo(() => {
    if (!tokenPair) {
      return true
    }

    for (let i = 0; i < tokenPairs.length; i++) {
      if (tokenPair.token0.address === tokenPairs[i].token0.address && tokenPair.token1.address === tokenPairs[i].token1.address)
        return true
    }
    return false
  }, [tokenPairs, tokenPair])
}

// returns all pairs as SDK Pair object
// requires everything to be loaded, otherwise the result
// will be an empty array
export const useSerializedWeightedPairsData = (chainId: number): { pairs: { [key1: string]: { [key2: string]: SerializedWeightedPair } } } => {
  const pairState = useSelector((state: State) => state.weightedPairs)[chainId]
  if (!pairState.metaDataLoaded || !pairState.reservesAndWeightsLoaded)
    return { pairs: {} }

  return {
    pairs: pairState.weightedPairs
  }

}
