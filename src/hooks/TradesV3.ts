/* eslint-disable no-param-reassign */
import { Currency, CurrencyAmount, Token, Swap, StablePool, AmplifiedWeightedPair, TokenAmount, Pool, SwapRoute, SwapType, PoolDictionary, WeightedPool, PairData, RouteProvider } from '@requiemswap/sdk'

import { useMemo } from 'react'
import { Interface } from '@ethersproject/abi'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useUserSingleHopOnly } from 'state/user/hooks'
import { TokenPair } from 'config/constants/types'
import RequiemPairABI from 'config/abi/avax/RequiemPair.json'
import { serializeToken } from 'state/user/hooks/helpers'
import {
  BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED,

} from '../config/constants'
// import { WeightedPairState, useGetWeightedPairs, useWeightedPairsDataLite } from './useWeightedPairs'
import { wrappedCurrency, wrappedCurrencyAmount } from '../utils/wrappedCurrency'

import { useUnsupportedTokens } from './Tokens'

const PAIR_INTERFACE = new Interface(RequiemPairABI)


function containsToken(token: Token, list: Token[]) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].equals(token)) {
      return true;
    }
  }

  return false;
}

export function useAllTradeTokenPairs(tokenA: Token, tokenB: Token, chainId: number): TokenPair[] {

  const [aInBase, bInBase] = useMemo(() =>
    [
      tokenA ? containsToken(tokenA, BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]) : false,
      tokenB ? containsToken(tokenB, BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]) : false
    ],
    [chainId, tokenA, tokenB])

  const expandedTokenList = useMemo(() => {
    if (!tokenA || !tokenB) {
      return BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]
    }
    if (aInBase && !bInBase) {
      return [...[tokenA], ...[tokenB], ...BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]]
    }
    if (!aInBase && !bInBase) {
      return [...[tokenA], ...[tokenB], ...BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]]
    }
    if (!aInBase && bInBase) {
      return [...[tokenA], ...BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]]
    }
    if (aInBase && bInBase) {
      return BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]
    }
    return []
  },
    [chainId, tokenA, tokenB, aInBase, bInBase])


  const basePairList: TokenPair[] = []
  for (let i = 0; i < expandedTokenList.length; i++) {
    for (let k = i + 1; k < expandedTokenList.length; k++) {
      basePairList.push(
        expandedTokenList[i].address.toLowerCase() < expandedTokenList[k].address.toLowerCase() ?
          {
            token0: serializeToken(expandedTokenList[i]),
            token1: serializeToken(expandedTokenList[k])
          } : {
            token0: serializeToken(expandedTokenList[k]),
            token1: serializeToken(expandedTokenList[i])
          }
      )
    }
  }
  return basePairList

}

/**
 * 
 * @param pairs pair array
 * @param stablePools stablePool array
 * @param weightedPools weightedPool array
 * @returns PoolDictionary as used for pricibng
 */
export function useGeneratePoolDict(
  pairs: AmplifiedWeightedPair[],
  stablePools: StablePool[],
  weightedPools: WeightedPool[]
): PoolDictionary {

  return useMemo(() => {
    return Object.assign({},
      ...[...pairs, ...stablePools, ...weightedPools]
        .map(e => { return { [e.address]: e } }))
  },
    [pairs, stablePools, weightedPools])
}


export function useGeneratePairData(
  pairs: AmplifiedWeightedPair[],
  stablePools: StablePool[],
  weightedPools: WeightedPool[]
): PairData[] {
  const pdPairs = useMemo(() => {
    return pairs.length > 0 ? PairData.dataFromPools(pairs) : []
  },
    [pairs])

  const pdStable = useMemo(() => {
    return stablePools.length > 0 ? PairData.dataFromPools(stablePools) : []
  },
    [stablePools])

  const pdWeighted = useMemo(() => {
    return weightedPools.length > 0 ? PairData.dataFromPools(weightedPools) : []
  },
    [weightedPools])


  return useMemo(() => {
    return [...pdPairs, ...pdStable, ...pdWeighted]
  },
    [pdPairs, pdStable, pdWeighted])
}

const MAX_HOPS = 6


export function useGetRoutes(
  pairData: PairData[],
  currencyIn: Token,
  currencyOut: Token
): SwapRoute[] {

  const allRoutes = useMemo(() => {
    return pairData.length > 0 && currencyIn && currencyOut ? RouteProvider.getRoutes(
      pairData,
      currencyIn,
      currencyOut,
      MAX_HOPS
    ) : []
  }, [pairData, currencyIn, currencyOut])

  return useMemo(() => { return SwapRoute.cleanRoutes(allRoutes) }, [allRoutes])
}


/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeV3ExactIn(
  publicDataLoaded: boolean,
  swapRoutes: SwapRoute[],
  poolDict: PoolDictionary,
  // these should always be defined through the route
  currencyAmountIn?: TokenAmount,
  currencyOut?: Token
): Swap | null {

  const [singleHopOnly] = useUserSingleHopOnly()

  return useMemo(() => {
    if (!publicDataLoaded)
      return null
    if (currencyAmountIn && currencyOut && swapRoutes.length > 0) {
      if (singleHopOnly) {
        try {
          return (
            Swap.PriceRoutes(swapRoutes.filter(r => r.swapData.length === 1), currencyAmountIn, SwapType.EXACT_INPUT, poolDict)[0] ??
            null
          )
        }
        catch {
          return null
        }
      }
      try {
        return Swap.PriceRoutes(swapRoutes, currencyAmountIn, SwapType.EXACT_INPUT, poolDict)[0] ??
          null
      } catch (error) {
        console.log(error)
        return null
      }
    }

    return null
  }, [swapRoutes, currencyAmountIn, currencyOut, singleHopOnly, publicDataLoaded, poolDict])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeV3ExactOut(
  publicDataLoaded: boolean,
  swapRoutes: SwapRoute[],
  poolDict: PoolDictionary,
  currencyIn?: Token,
  currencyAmountOut?: TokenAmount
): Swap | null {

  const [singleHopOnly] = useUserSingleHopOnly()
  return useMemo(() => {
    if (!publicDataLoaded)
      return null

    if (currencyIn && currencyAmountOut && swapRoutes.length > 0) {
      if (singleHopOnly) {
        try {
          return (
            Swap.PriceRoutes(swapRoutes.filter(r => r.swapData.length === 1), currencyAmountOut, SwapType.EXACT_OUTPUT, poolDict)[0] ??
            null
          )
        }
        catch {
          return null
        }
      }
      try {
        return Swap.PriceRoutes(swapRoutes, currencyAmountOut, SwapType.EXACT_OUTPUT, poolDict)[0] ??
          null
      } catch (error) {
        console.log(error)
        return null
      }

    }
    return null
  }, [swapRoutes, currencyIn, currencyAmountOut, singleHopOnly, publicDataLoaded, poolDict])
}

export function useIsTransactionUnsupported(chainId: number, currencyIn?: Currency, currencyOut?: Currency): boolean {
  const unsupportedTokens: { [address: string]: Token } = useUnsupportedTokens(chainId)

  const tokenIn = wrappedCurrency(currencyIn, chainId)
  const tokenOut = wrappedCurrency(currencyOut, chainId)

  // if unsupported list loaded & either token on list, mark as unsupported
  if (unsupportedTokens) {
    if (tokenIn && Object.keys(unsupportedTokens).includes(tokenIn.address)) {
      return true
    }
    if (tokenOut && Object.keys(unsupportedTokens).includes(tokenOut.address)) {
      return true
    }
  }

  return false
}
