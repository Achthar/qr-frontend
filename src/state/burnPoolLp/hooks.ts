import { Percent, TokenAmount, StablePool, Token, WeightedPool, ZERO } from '@requiemswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swapV3/hooks'

import {
  PoolField, typeInputLp, setTypeSingleInputs, typeInputSingle, selectStableSingle, typeInputPooledToken
} from './actions'



export function useBurnPoolLpState(): AppState['burnPoolLp'] {
  return useSelector<AppState, AppState['burnPoolLp']>((state) => state.burnPoolLp)
}

export function useDerivedBurnPoolLpInfo(
  chainId: number,
  relevantTokenBalances: {
    [tokenAddress: string]: TokenAmount;
  },
  weightedPool: WeightedPool,
  publicDataLoaded: boolean,
  account?: string,
): {
  parsedAmounts: {
    [PoolField.LIQUIDITY_PERCENT]: Percent
    [PoolField.LIQUIDITY]?: TokenAmount
    [PoolField.SELECTED_SINGLE]?: number
    [PoolField.CURRENCY_SINGLE]?: TokenAmount
    [PoolField.LIQUIDITY_DEPENDENT]?: TokenAmount
    [PoolField.CURRENCY_SINGLE_FEE]?: TokenAmount
    [PoolField.LIQUIDITY_SINGLE]?: TokenAmount
  },
  parsedOutputTokenAmounts: TokenAmount[],
  calculatedValuesFormatted: string[],
  error?: string
  errorSingle?: string
  liquidityTradeValues?: TokenAmount[]
} {

  const {
    independentPoolField,
    typedValueLiquidity,
    typedValueSingle,
    selectedStableSingle,
    typedValues
  } = useBurnPoolLpState()

  // lp balance
  const userLiquidity: undefined | TokenAmount = weightedPool && relevantTokenBalances?.[weightedPool.liquidityToken.address ?? '']

  const poolTokens = weightedPool?.tokens

  const tokens = {
    [PoolField.SELECTED_SINGLE]: selectedStableSingle,
    [PoolField.CURRENCY_SINGLE]: poolTokens?.[selectedStableSingle],
    [PoolField.LIQUIDITY]: weightedPool?.liquidityToken,
  }

  // liquidity values
  const totalSupply = !publicDataLoaded ? ZERO : weightedPool.lpTotalSupply


  // default values are set here
  let percentToRemove: Percent = new Percent('0', '100')
  let poolAmountsFromLp = [ZERO, ZERO, ZERO, ZERO]
  let liquidityAmount = ZERO
  let calculatedValuesFormatted = poolTokens?.map((_, i) => typedValues[i]) ?? ['0', '0', '0', '0', '0']
  let feeFinal = tokens[PoolField.CURRENCY_SINGLE] && new TokenAmount(tokens[PoolField.CURRENCY_SINGLE], ZERO)
  let singleAmount = ZERO
  let singleAmountCalculated = ZERO
  let fee = ZERO

  const independentAmounts = poolTokens?.map((t, index) => tryParseAmount(chainId, typedValues[index] === '' ? '0' : typedValues[index], t))

  const independentLpAmount = tryParseAmount(chainId, typedValueLiquidity === '' ? '0' : typedValueLiquidity, tokens[PoolField.LIQUIDITY])
  const singleLpAmount = tryParseAmount(chainId, typedValueSingle === '' ? '0' : typedValueSingle, weightedPool?.liquidityToken)
  let error: string | undefined
  // user specified a %
  if (independentPoolField === PoolField.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValueLiquidity, '100')

    if (weightedPool && percentToRemove.greaterThan('0')) {
      try {
        poolAmountsFromLp = weightedPool.calculateRemoveLiquidity( // BigNumber.from(percentToRemove.multiply(userLiquidity))
          BigNumber.from(percentToRemove.numerator).mul(userLiquidity.toBigNumber()).div(BigNumber.from(percentToRemove.denominator)
          )
        )
        const { amountOut, swapFee } = weightedPool.calculateRemoveLiquidityOneToken(
          BigNumber.from(percentToRemove.numerator).mul(userLiquidity.toBigNumber()).div(BigNumber.from(percentToRemove.denominator)),
          selectedStableSingle
        )
        singleAmountCalculated = amountOut
        fee = swapFee
      } catch {
        error = 'Invalid Amount'
      }
      calculatedValuesFormatted = poolAmountsFromLp.map(
        (amount, index) => new TokenAmount(poolTokens[index], amount)
      ).map(amount => amount.toSignificant(6))



      feeFinal = new TokenAmount(tokens[PoolField.CURRENCY_SINGLE], fee)
      singleAmount = singleAmountCalculated

    }
  }
  // user specified a specific amount of liquidity tokens
  else if (independentPoolField === PoolField.LIQUIDITY) {
    if (weightedPool && independentLpAmount) {
      try {
        poolAmountsFromLp = weightedPool.calculateRemoveLiquidity(
          independentLpAmount.toBigNumber()
        )
        const { amountOut, swapFee } = weightedPool.calculateRemoveLiquidityOneToken(
          independentLpAmount.toBigNumber(),
          selectedStableSingle
        )
        singleAmountCalculated = amountOut
        fee = swapFee
      } catch {
        error = 'Invalid Amount'
      }
      calculatedValuesFormatted = poolAmountsFromLp.map(
        (amount, index) => new TokenAmount(poolTokens[index], amount)
      ).map(amount => amount.toSignificant(6))

      if (poolAmountsFromLp && userLiquidity && !independentLpAmount.greaterThan(userLiquidity)) {
        percentToRemove = new Percent(independentLpAmount.raw, userLiquidity.raw)
      }


      feeFinal = new TokenAmount(tokens[PoolField.CURRENCY_SINGLE], fee)
      singleAmount = singleAmountCalculated

    }

  }
  // user specified a specific amount of tokens in the pool
  // this can hapen fully idependently from each other
  else
    if (weightedPool) {
      try {
        liquidityAmount = weightedPool.getLiquidityAmount(
          independentAmounts?.map(a => a.raw),
          false // false for withdrawl
        )
      } catch {
        liquidityAmount = ZERO
        error = 'Invariant ratio'
      }
      percentToRemove = liquidityAmount.gte(totalSupply) ? new Percent('100', '100') : new Percent(liquidityAmount.toBigInt(), totalSupply.toBigInt())

    }

  // create the cases for the single stables amount inputs
  const finalSingleAmounts = (independentPoolField === PoolField.LIQUIDITY || independentPoolField === PoolField.LIQUIDITY_PERCENT) ?
    weightedPool && poolAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0') && poolAmountsFromLp?.map((am, index) => new TokenAmount(poolTokens[index], am))
    : // cases when single stable amounts are provided
    weightedPool && independentAmounts !== undefined && independentAmounts?.map((am, i) => new TokenAmount(poolTokens[i], am?.raw ?? '0'))

  const finalLiquidityAmount = (independentPoolField === PoolField.LIQUIDITY_PERCENT) ?
    userLiquidity?.raw !== undefined && percentToRemove && percentToRemove.greaterThan('0')
      ? new TokenAmount(weightedPool.liquidityToken, percentToRemove.multiply(userLiquidity.raw).quotient)
      : undefined :
    independentLpAmount as TokenAmount

  // finally the output is put together
  const parsedAmounts: {
    [PoolField.LIQUIDITY_PERCENT]: Percent
    [PoolField.LIQUIDITY]?: TokenAmount
    [PoolField.LIQUIDITY_DEPENDENT]?: TokenAmount
    [PoolField.CURRENCY_SINGLE_FEE]?: TokenAmount
    [PoolField.LIQUIDITY_SINGLE]?: TokenAmount
    [PoolField.SELECTED_SINGLE]?: number
    [PoolField.CURRENCY_SINGLE]?: TokenAmount
  } = {
    [PoolField.LIQUIDITY_PERCENT]: percentToRemove,
    [PoolField.LIQUIDITY]: finalLiquidityAmount,
    [PoolField.LIQUIDITY_DEPENDENT]:
      weightedPool && poolAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0') && liquidityAmount
        ? new TokenAmount(weightedPool.liquidityToken, liquidityAmount.toBigInt())
        : undefined,
    [PoolField.CURRENCY_SINGLE_FEE]: feeFinal,
    [PoolField.LIQUIDITY_SINGLE]: wrappedCurrencyAmount(singleLpAmount, chainId),
    [PoolField.SELECTED_SINGLE]: selectedStableSingle,
    [PoolField.CURRENCY_SINGLE]: tokens[PoolField.CURRENCY_SINGLE] && new TokenAmount(tokens[PoolField.CURRENCY_SINGLE], singleAmount.toBigInt())
  }


  let errorSingle: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[PoolField.LIQUIDITY]) {
    error = error ?? 'Enter an amount'
  }
  if (!parsedAmounts[PoolField.LIQUIDITY_SINGLE] || !parsedAmounts[PoolField.CURRENCY_SINGLE]) {
    errorSingle = errorSingle ?? 'Enter an amount'
  }

  const newPool = weightedPool?.clone()
  if (newPool && finalSingleAmounts[0] !== undefined) {
    newPool.setTokenBalances(newPool.getBalances().map((val, index) => val.sub(finalSingleAmounts[index].toBigNumber())))
  }

  const liquidityValues = useMemo(() => {
    let vals = weightedPool?.tokens.map(tk => new TokenAmount(tk, ZERO))
    if (weightedPool &&
      totalSupply &&
      userLiquidity  && finalSingleAmounts) {
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      try {
        vals = totalSupply.gte(userLiquidity.toBigNumber()) && poolTokens?.map((_, i) => weightedPool?.getLiquidityValue(0, finalSingleAmounts?.map((amnt) => amnt.toBigNumber())))
      } catch {
        return vals
      }
    }
    return vals
  }, [finalSingleAmounts, poolTokens, totalSupply, userLiquidity, weightedPool])

  return {
    parsedAmounts,
    error,
    calculatedValuesFormatted,
    errorSingle,
    liquidityTradeValues: liquidityValues,
    parsedOutputTokenAmounts: finalSingleAmounts
  }
}

export function useBurnPoolLpActionHandlers(): {
  onLpInput: (poolField: PoolField, typedValueLp: string) => void,
  onLpInputSetOthers: (typedValues: string[]) => void,
  onSingleFieldInput: (poolField: PoolField, typedValueSingle: string) => void,
  onFieldInput: (typedValue: string, index: number) => void,
  onSelectStableSingle: (selectedStableSingle: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldInput = useCallback(
    (typedValue: string, index: number) => {
      dispatch(typeInputPooledToken({
        typedValue,
        index
      }))
    },
    [dispatch],
  )

  const onLpInput = useCallback(
    (poolField: PoolField, typedValueLp: string) => {
      dispatch(typeInputLp({
        poolField,
        typedValueLp
      }))
    },
    [dispatch],
  )

  const onSingleFieldInput = useCallback(
    (poolField: PoolField, typedValueSingle: string) => {
      dispatch(typeInputSingle({
        poolField,
        typedValueSingle
      }))
    },
    [dispatch],
  )

  const onLpInputSetOthers = useCallback(
    (calculatedSingleValues: string[]) => {
      dispatch(setTypeSingleInputs({
        calculatedSingleValues
      }))
    },
    [dispatch],
  )

  const onSelectStableSingle = useCallback(
    (selectedStableSingle: number) => {
      dispatch(selectStableSingle({
        selectedStableSingle
      }))
    },
    [dispatch],
  )

  return {
    onFieldInput,
    onLpInput,
    onLpInputSetOthers,
    onSingleFieldInput,
    onSelectStableSingle
  }
}
