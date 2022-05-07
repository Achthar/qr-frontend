import { Currency, CurrencyAmount, AmplifiedWeightedPair, Percent, TokenAmount } from '@requiemswap/sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { useWeightedPair } from 'hooks/useWeightedPairs'
import useTotalSupply from 'hooks/useTotalSupply'

import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swapV3/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { Field, typeInput, setFee, setWeight } from './actions'

export function useBurnState(): AppState['burn'] {
  return useSelector<AppState, AppState['burn']>((state) => state.burn)
}

export function useDerivedBurnInfo(
  chainId: number,
  account: string,
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  weightFieldA: string,
  pairData: AmplifiedWeightedPair[],
  loadedBalances?: TokenAmount[],
  loadedSupply?: TokenAmount[],
  dataLoaded?: boolean
): {
  pair?: AmplifiedWeightedPair | null
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: CurrencyAmount
    [Field.CURRENCY_B]?: CurrencyAmount
  }
  weightFieldA: string
  error?: string
} {
  let pair: AmplifiedWeightedPair
  let totalSupply: TokenAmount
  let userLiquidity: TokenAmount

  const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]

  const aIs0 = tokenA.sortsBefore(tokenB)
  const relevantPairData = pairData.map((_, index) => {
    return {
      pair: pairData[index],
      supply: loadedSupply[index],
      balance: loadedBalances[index]
    }
  }).filter(data => data.pair.token0.address === (aIs0 ? tokenA.address : tokenB.address) && data.pair.token1.address === (aIs0 ? tokenB.address : tokenA.address))

  const pairInState = relevantPairData.length > 0

  const { independentField, typedValue } = useBurnState()

  const loadManual = dataLoaded && !pairInState

  // these only should be done if apirs are unavailable in state - that is faster due to navigatioon from pool

  // pair + totalsupply
  const [, _pair] = useWeightedPair(chainId, loadManual && currencyA, loadManual && currencyB, loadManual && Number(weightFieldA))
  // liquidity values
  const _totalSupply = useTotalSupply(loadManual && _pair?.liquidityToken)
  // balances
  const relevantTokenBalances = useTokenBalances(loadManual && (account ?? undefined), loadManual ? [pair?.liquidityToken] : [])
  const _userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[pair?.liquidityToken?.address ?? '']

  if (loadManual) {
    pair = _pair
    totalSupply = _totalSupply
    userLiquidity = _userLiquidity
  } else {
    pair = relevantPairData[0]?.pair
    totalSupply = relevantPairData[0]?.supply
    userLiquidity = relevantPairData[0]?.balance
  }

  const tokens = {
    [Field.CURRENCY_A]: tokenA,
    [Field.CURRENCY_B]: tokenB,
    [Field.LIQUIDITY]: pair?.liquidityToken,
  }

  const liquidityValueA =
    pair &&
      totalSupply &&
      userLiquidity &&
      tokenA &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.raw.gte(userLiquidity.raw)
      ? new TokenAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupply, userLiquidity, false).raw)
      : undefined
  const liquidityValueB =
    pair &&
      totalSupply &&
      userLiquidity &&
      tokenB &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.raw.gte(userLiquidity.raw)
      ? new TokenAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupply, userLiquidity, false).raw)
      : undefined
  const liquidityValues: { [Field.CURRENCY_A]?: TokenAmount;[Field.CURRENCY_B]?: TokenAmount } = {
    [Field.CURRENCY_A]: liquidityValueA,
    [Field.CURRENCY_B]: liquidityValueB,
  }

  let percentToRemove: Percent = new Percent('0', '100')
  // user specified a %
  if (independentField === Field.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValue, '100')
  }
  // user specified a specific amount of liquidity tokens
  else if (independentField === Field.LIQUIDITY) {
    if (pair?.liquidityToken) {
      const independentAmount = tryParseAmount(chainId, typedValue, pair.liquidityToken)
      if (independentAmount && userLiquidity && !independentAmount.greaterThan(userLiquidity)) {
        percentToRemove = new Percent(independentAmount.raw, userLiquidity.raw)
      }
    }
  }
  // user specified a specific amount of token a or b
  else if (tokens[independentField]) {
    const independentAmount = tryParseAmount(chainId, typedValue, tokens[independentField])
    const liquidityValue = liquidityValues[independentField]
    if (independentAmount && liquidityValue && !independentAmount.greaterThan(liquidityValue)) {
      percentToRemove = new Percent(independentAmount.raw, liquidityValue.raw)
    }
  }

  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY_A]?: TokenAmount
    [Field.CURRENCY_B]?: TokenAmount
  } = {
    [Field.LIQUIDITY_PERCENT]: percentToRemove,
    [Field.LIQUIDITY]:
      userLiquidity && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(userLiquidity.token, percentToRemove.multiply(userLiquidity.raw).quotient)
        : undefined,
    [Field.CURRENCY_A]:
      tokenA && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueA
        ? new TokenAmount(tokenA, percentToRemove.multiply(liquidityValueA.raw).quotient)
        : undefined,
    [Field.CURRENCY_B]:
      tokenB && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueB
        ? new TokenAmount(tokenB, percentToRemove.multiply(liquidityValueB.raw).quotient)
        : undefined,
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  return { pair, parsedAmounts, error, weightFieldA }
}

export function useBurnActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
  onSetFee: (typedFee: string) => void
  onSetWeightA: (typedWeight: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch],
  )

  const onSetFee = useCallback(
    (typedFee: string) => {
      dispatch(setFee({ typedFee }))
    },
    [dispatch],
  )

  const onSetWeightA = useCallback(
    (typedWeight: string) => {
      dispatch(setWeight({ typedWeight }))
    },
    [dispatch],
  )

  return {
    onUserInput,
    onSetFee,
    onSetWeightA
  }
}
