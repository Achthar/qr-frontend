/* eslint-disable no-param-reassign */
import { isTradeV3Better } from 'utils/tradesV3'
import { Currency, CurrencyAmount, Pair, Token, TradeV3, StablePool, StablePairWrapper } from '@requiemswap/sdk'
import flatMap from 'lodash/flatMap'
import { useMemo } from 'react'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { StablePoolState } from 'hooks/useStablePool'
import { useUserSingleHopOnly } from 'state/user/hooks'
import {
  BASES_TO_CHECK_TRADES_AGAINST,
  CUSTOM_BASES,
  BETTER_TRADE_LESS_HOPS_THRESHOLD,
  ADDITIONAL_BASES,
} from '../config/constants'
import { PairState, usePairs } from './usePairs'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useUnsupportedTokens } from './Tokens'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()

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

const MAX_HOPS = 4

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeV3ExactIn(stablePoolState: StablePoolState, stablePool: StablePool, currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): TradeV3 | null {

  const [singleHopOnly] = useUserSingleHopOnly()
  const regularPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut) as (Pair | StablePairWrapper)[]
  return useMemo(() => {
    let allowedPairs = regularPairs
    if (stablePoolState !== StablePoolState.EXISTS)
      return null

    if (stablePool && stablePool !== null) { allowedPairs = allowedPairs.concat(StablePairWrapper.wrapPairsFromPool(stablePool)) }

    if (currencyAmountIn && currencyOut && allowedPairs.length > 0 && stablePool !== null) {
      if (singleHopOnly) {
        return (
          TradeV3.bestTradeExactIn(stablePool, allowedPairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: TradeV3 | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade: TradeV3 | null =
          TradeV3.bestTradeExactIn(stablePool, allowedPairs, currencyAmountIn, currencyOut, { maxHops: i, maxNumResults: 1 })[0] ??
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
export function useTradeV3ExactOut(stablePoolState: StablePoolState, stablePool: StablePool, currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): TradeV3 | null {

  const [singleHopOnly] = useUserSingleHopOnly()
  const regularPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency) as (Pair | StablePairWrapper)[]
  return useMemo(() => {
    let allowedPairs = regularPairs
    if (stablePoolState !== StablePoolState.EXISTS)
      return null

    if (stablePool && stablePool !== null) { allowedPairs = allowedPairs.concat(StablePairWrapper.wrapPairsFromPool(stablePool)) }

    if (currencyIn && currencyAmountOut && allowedPairs.length > 0 && stablePool !== null) {
      if (singleHopOnly) {
        return (
          TradeV3.bestTradeExactOut(stablePool, allowedPairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: TradeV3 | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade =
          TradeV3.bestTradeExactOut(stablePool, allowedPairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
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
  const { chainId } = useActiveWeb3React()

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
