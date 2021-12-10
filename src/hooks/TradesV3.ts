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
import { WeightedPairState, useWeightedPairs, useWeightedPairsExist } from './useWeightedPairs'
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

  const allPairs = usePairs(allPairCombinations)
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


// funtion to get all relevant weighted pairs
// requires two calls if ccys are not in base
// 1) check whether pair exists
// 2) fetch reserves
function useAllCommonWeightedPairs(currencyA?: Currency, currencyB?: Currency): WeightedPair[] {
  const { chainId } = useNetworkState()

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const bases: Token[] = useMemo(() => {
    if (!chainId) return []

    const common = BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId] ?? []
    // const additionalA = tokenA ? ADDITIONAL_BASES[chainId]?.[tokenA.address] ?? [] : []
    // const additionalB = tokenB ? ADDITIONAL_BASES[chainId]?.[tokenB.address] ?? [] : []

    return common
  }, [chainId,
    // tokenA, tokenB
  ])

  const aInBases = false // currencyA && bases.filter((base) => base.address === wrappedCurrency(currencyA, chainId).address)[0] !== undefined
  const bInBases = false // currencyB && bases.filter((base) => base.address === wrappedCurrency(currencyB, chainId).address)[0] !== undefined

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

  // console.log("AP", allPairCombinations)

  const allWeightedPairs = useMemo(
    () =>
      currencyB && currencyA ?

        weightedPairShellGeneratorAll(
          allPairCombinations,
          STANDARD_WEIGHTS, STANDARD_FEES
        )
        : []
    ,
    [currencyB, currencyA, allPairCombinations]
  )

  // array conaining [id, address]
  // const allPairsDirty = useMemo(() => { return [...addressesRangeA, ...addressesRangeB, ...direct] },
  //   [addressesRangeA, addressesRangeB, direct]
  // )
  // console.log("APDIRTY", allWeightedPairs)
  const allConstellations = useWeightedPairsExist(
    chainId,
    allWeightedPairs.map(x => x.address) ?? ['0xfcD5aB89AFB2280a9ff98DAaa2749C6D11aB4161'],
    5
  )

  // get only existing pairs
  const filtered = allWeightedPairs.filter((pairShell) => allConstellations[pairShell.address] === 1);

  // fetch data from chain via MultiCall
  const results = useMultipleContractSingleData(filtered.map(pair => pair.address), PAIR_INTERFACE, 'getReserves')
  // console.log("AC", allConstellations, "FILTERED", filtered, "RES", results)
  // generate Weighted Pairs
  const weightedPairs = useMemo(() => {
    return results.map((result, i) => {

      const { result: reserves, loading } = result
      const _tokenA = filtered[i].tokenA
      const _tokenB = filtered[i].tokenB

      if (loading) return [WeightedPairState.LOADING, null]
      if (!_tokenA || !_tokenB || _tokenA.equals(_tokenB)) return [WeightedPairState.INVALID, null]
      if (!reserves) return [WeightedPairState.NOT_EXISTS, null]
      const { _reserve0: reserve0, _reserve1: reserve1 } = reserves
      const [token0, token1] = _tokenA.sortsBefore(_tokenB) ? [_tokenA, _tokenB] : [_tokenB, _tokenA]
      const weight0 = _tokenA.sortsBefore(_tokenB) ? JSBI.BigInt(filtered[i].weightA) : JSBI.BigInt(100 - filtered[i].weightA)
      return [
        WeightedPairState.EXISTS,
        new WeightedPair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
          weight0,
          JSBI.BigInt(filtered[i].fee))
      ]

    })
  }, [results, filtered])

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        weightedPairs
          // filter out invalid pairs
          .filter((result): result is [WeightedPairState.EXISTS, WeightedPair] => Boolean(result[0] === WeightedPairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: WeightedPair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {}),
      ),
    [weightedPairs],
  )
}

const MAX_HOPS = 4

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeV3ExactIn(stablePoolState: StablePoolState, stablePool: StablePool, currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): TradeV4 | null {

  const [singleHopOnly] = useUserSingleHopOnly()
  const regularPairs = useAllCommonWeightedPairs(currencyAmountIn?.currency, currencyOut) as Pool[]
  return useMemo(() => {
    let allowedPairs = regularPairs
    if (stablePoolState !== StablePoolState.EXISTS)
      return null

    if (stablePool && stablePool !== null) { allowedPairs = allowedPairs.concat(StablePairWrapper.wrapPairsFromPool(stablePool)) }

    if (currencyAmountIn && currencyOut && allowedPairs.length > 0 && stablePool !== null) {
      if (singleHopOnly) {
        return (
          TradeV4.bestTradeExactIn(stablePool, allowedPairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: TradeV4 | null = null
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
    }

    return null
  }, [regularPairs, currencyAmountIn, currencyOut, singleHopOnly, stablePool, stablePoolState])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeV3ExactOut(stablePoolState: StablePoolState, stablePool: StablePool, currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): TradeV4 | null {

  const [singleHopOnly] = useUserSingleHopOnly()
  const regularPairs = useAllCommonWeightedPairs(currencyIn, currencyAmountOut?.currency) as Pool[]
  return useMemo(() => {
    let allowedPairs = regularPairs
    if (stablePoolState !== StablePoolState.EXISTS)
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
  }, [regularPairs, currencyIn, currencyAmountOut, singleHopOnly, stablePool, stablePoolState])
}

export function useIsTransactionUnsupported(currencyIn?: Currency, currencyOut?: Currency): boolean {
  const unsupportedTokens: { [address: string]: Token } = useUnsupportedTokens()
  const { chainId } = useNetworkState()

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
