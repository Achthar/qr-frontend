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

// funtion to get all relevant weighted pairs
// requires two calls if ccys are not in base
// 1) check whether pair exists
// 2) fetch reserves
// function useAllCommonWeightedPairs(currencyA?: Currency, currencyB?: Currency): AmplifiedWeightedPair[] {
//   const { chainId } = useNetworkState()

//   const [tokenA, tokenB] = chainId
//     ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
//     : [undefined, undefined]

//   const [aInBase, bInBase] = useMemo(() =>
//     [
//       tokenA ? containsToken(tokenA, BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]) : false,
//       tokenB ? containsToken(tokenB, BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]) : false
//     ],
//     [chainId, tokenA, tokenB])

//   const expandedTokenList = useMemo(() => {
//     if (aInBase && !bInBase) {
//       return [...[tokenA], ...[tokenB], ...BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]]
//     }
//     if (!aInBase && !bInBase) {
//       return [...[tokenA], ...[tokenB], ...BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]]
//     }
//     if (!aInBase && bInBase) {
//       return [...[tokenA], ...BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]]
//     }
//     if (aInBase && bInBase) {
//       return BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]
//     }
//     return []
//   },
//     [chainId, tokenA, tokenB, aInBase, bInBase])

//   const basePairs = useMemo(() => {
//     const basePairList: [Token, Token][] = []
//     for (let i = 0; i < expandedTokenList.length; i++) {
//       for (let k = i; k < expandedTokenList.length; k++) {
//         basePairList.push(
//           [
//             expandedTokenList[i],
//             expandedTokenList[k]
//           ]
//         )
//       }
//     }
//     return basePairList
//   }, [expandedTokenList])

//   const allPairCombinations: [Token, Token][] = useMemo(
//     () =>
//       basePairs
//         .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
//         .filter(([t0, t1]) => t0.address !== t1.address),
//     [basePairs],
//   )

//   const addressesRaw = useGetWeightedPairs(allPairCombinations, chainId)

//   const pairData = useMemo(
//     () =>
//       addressesRaw
//         ? addressesRaw
//           .map((addressData, index) => [addressData[0], allPairCombinations[index], addressData[1]])
//           .filter(x => x[0] === WeightedPairState.EXISTS)
//         : [],
//     [addressesRaw, allPairCombinations]
//   )

//   const [relevantPairs, addressList] = useMemo(() => {
//     const data: [Token, Token][] = []
//     const dataAddress: string[] = []
//     for (let j = 0; j < pairData.length; j++) {
//       for (let k = 0; k < (pairData[j][2] as string[]).length; k++) {
//         data.push(pairData[j][1] as [Token, Token])
//         dataAddress.push(pairData[j][2][k])
//       }
//     }
//     return [data, dataAddress]
//   }, [pairData])

//   const weightedPairsData = useWeightedPairsDataLite(
//     relevantPairs,
//     addressList,
//     chainId
//   )


//   return useMemo(
//     () => {
//       return weightedPairsData.filter(x => x[0] === WeightedPairState.EXISTS).map(entry => entry[1])
//     },
//     [weightedPairsData]
//   )

// }

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
  currencyAmountIn?: CurrencyAmount,
  currencyOut?: Currency
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
        return Swap.PriceRoutes(swapRoutes, wrappedCurrencyAmount(currencyAmountIn, swapRoutes[0].chainId), SwapType.EXACT_INPUT, poolDict)[0] ??
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
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount
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
