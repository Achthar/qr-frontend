/* eslint-disable no-param-reassign */
import { isTradeV3Better } from 'utils/tradesV3'
import { Currency, CurrencyAmount, Pair, Token, TradeV4, StablePool, StablePairWrapper, WeightedPair, TokenAmount, JSBI, Pool } from '@requiemswap/sdk'
import flatMap from 'lodash/flatMap'
import { WeightedPairShell } from 'config/constants'
import { useMemo } from 'react'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { Interface } from '@ethersproject/abi'
import { weightedPairAddresses, weightedPairShellGenerator, weightedPairShellGeneratorAll } from 'utils/weightedPairAddresses'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { StablePoolState } from 'hooks/useStablePool'
import { useUserSingleHopOnly } from 'state/user/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import RequiemPairABI from 'config/abi/avax/RequiemPair.json'
import {
  BASES_TO_CHECK_TRADES_AGAINST,
  BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED,
  PINNED_WEIGHTED_PAIRS,
  CUSTOM_BASES,
  BETTER_TRADE_LESS_HOPS_THRESHOLD,
  ADDITIONAL_BASES,
  STANDARD_FEES,
  STANDARD_WEIGHTS
} from '../config/constants'
import { PairState, usePairs } from './usePairs'
import { WeightedPairState, useWeightedPairs, useWeightedPairsExist, useGetWeightedPairs, useWeightedPairsData, useWeightedPairsDataLite } from './useWeightedPairs'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useUnsupportedTokens } from './Tokens'

const PAIR_INTERFACE = new Interface(RequiemPairABI)

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useNetworkState()

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const bases: Token[] = useMemo(() => {
    if (!chainId) return []

    const common = BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? []
    const additionalA = tokenA ? ADDITIONAL_BASES[chainId]?.[tokenA.address] ?? [] : []
    const additionalB = tokenB ? ADDITIONAL_BASES[chainId]?.[tokenB.address] ?? [] : []

    return [...common, ...additionalA, ...additionalB]
  }, [chainId, tokenA, tokenB])

  const basePairs: [Token, Token][] = useMemo(
    () => flatMap(bases, (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase])),
    [bases],
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
          // the direct pair
          [tokenA, tokenB],
          // token A against all bases
          ...bases.map((base): [Token, Token] => [tokenA, base]),
          // token B against all bases
          ...bases.map((base): [Token, Token] => [tokenB, base]),
          // each base against all bases
          ...basePairs,
        ]
          .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
          .filter(([t0, t1]) => t0.address !== t1.address)
          .filter(([tokenA_, tokenB_]) => {
            if (!chainId) return true
            const customBases = CUSTOM_BASES[chainId]

            const customBasesA: Token[] | undefined = customBases?.[tokenA_.address]
            const customBasesB: Token[] | undefined = customBases?.[tokenB_.address]

            if (!customBasesA && !customBasesB) return true

            if (customBasesA && !customBasesA.find((base) => tokenB_.equals(base))) return false
            if (customBasesB && !customBasesB.find((base) => tokenA_.equals(base))) return false

            return true
          })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId],
  )

  const allPairs = usePairs(chainId, allPairCombinations)
  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {}),
      ),
    [allPairs],
  )
}

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
function useAllCommonWeightedPairs(currencyA?: Currency, currencyB?: Currency): WeightedPair[] {
  const { chainId } = useNetworkState()

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const [aInBase, bInBase] = useMemo(() =>
    [
      tokenA ? containsToken(tokenA, BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]) : false,
      tokenB ? containsToken(tokenB, BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId]) : false
    ],
    [chainId, tokenA, tokenB])

  const expandedTokenList = useMemo(() => {
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

  const basePairs = useMemo(() => {
    const basePairList: [Token, Token][] = []
    for (let i = 0; i < expandedTokenList.length; i++) {
      for (let k = i; k < expandedTokenList.length; k++) {
        basePairList.push(
          [
            expandedTokenList[i],
            expandedTokenList[k]
          ]
        )
      }
    }
    return basePairList
  }, [expandedTokenList])

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      basePairs
        .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
        .filter(([t0, t1]) => t0.address !== t1.address),
    [basePairs],
  )

  const addressesRaw = useGetWeightedPairs(allPairCombinations, chainId)

  const pairData = useMemo(
    () =>
      addressesRaw
        ? addressesRaw
          .map((addressData, index) => [addressData[0], allPairCombinations[index], addressData[1]])
          .filter(x => x[0] === WeightedPairState.EXISTS)
        : [],
    [addressesRaw, allPairCombinations]
  )

  const [relevantPairs, addressList] = useMemo(() => {
    const data: [Token, Token][] = []
    const dataAddress: string[] = []
    for (let j = 0; j < pairData.length; j++) {
      for (let k = 0; k < (pairData[j][2] as string[]).length; k++) {
        data.push(pairData[j][1] as [Token, Token])
        dataAddress.push(pairData[j][2][k])
      }
    }
    return [data, dataAddress]
  }, [pairData])

  const weightedPairsData = useWeightedPairsDataLite(
    relevantPairs,
    addressList,
    chainId)


  return useMemo(
    () => {
      return weightedPairsData.filter(x => x[0] === WeightedPairState.EXISTS).map(entry => entry[1])
    },
    [weightedPairsData]
  )

}

const MAX_HOPS = 4

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeV3ExactIn(
  publicDataLoaded: boolean,
  stablePool: StablePool,
  currencyAmountIn?: CurrencyAmount,
  currencyOut?: Currency
): TradeV4 | null {

  const [singleHopOnly] = useUserSingleHopOnly()
  const regularPairs = useAllCommonWeightedPairs(currencyAmountIn?.currency, currencyOut) as Pool[]
  return useMemo(() => {
    let allowedPairs = regularPairs
    if (!publicDataLoaded)
      return null

    if (stablePool && stablePool !== null) { allowedPairs = allowedPairs.concat(StablePairWrapper.wrapPairsFromPool(stablePool)) }

    if (currencyAmountIn && currencyOut && allowedPairs.length > 0 && stablePool !== null) {
      if (singleHopOnly) {
        try {
          return (
            TradeV4.bestTradeExactIn(stablePool, allowedPairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ??
            null
          )
        }
        catch {
          return null
        }
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: TradeV4 | null = null
      try {
        for (let i = 1; i <= MAX_HOPS; i++) {
          const currentTrade: TradeV4 | null =
            TradeV4.bestTradeExactIn(stablePool, allowedPairs, currencyAmountIn, currencyOut, { maxHops: i, maxNumResults: 1 })[0] ??
            null
          // if current trade is best yet, save it
          if (isTradeV3Better(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
            bestTradeSoFar = currentTrade
          }
        }
        return bestTradeSoFar
      } catch {
        return null
      }
    }

    return null
  }, [regularPairs, currencyAmountIn, currencyOut, singleHopOnly, stablePool, publicDataLoaded])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeV3ExactOut(
  publicDataLoaded: boolean,
  stablePool: StablePool,
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount
): TradeV4 | null {

  const [singleHopOnly] = useUserSingleHopOnly()
  const regularPairs = useAllCommonWeightedPairs(currencyIn, currencyAmountOut?.currency) as Pool[]
  return useMemo(() => {
    let allowedPairs = regularPairs
    if (!publicDataLoaded)
      return null

    if (stablePool && stablePool !== null) { allowedPairs = allowedPairs.concat(StablePairWrapper.wrapPairsFromPool(stablePool)) }

    if (currencyIn && currencyAmountOut && allowedPairs.length > 0 && stablePool !== null) {
      if (singleHopOnly) {
        return (
          TradeV4.bestTradeExactOut(stablePool, allowedPairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: TradeV4 | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade =
          TradeV4.bestTradeExactOut(stablePool, allowedPairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        if (isTradeV3Better(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }
    return null
  }, [regularPairs, currencyIn, currencyAmountOut, singleHopOnly, stablePool, publicDataLoaded])
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
