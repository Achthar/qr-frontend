import { Percent, TokenAmount, StablePool, Token } from '@requiemswap/sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swapV3/hooks'

import {
  StablesField, typeInput1, typeInput2, typeInput3, typeInput4, typeInputLp, setTypeSingleInputs,
  typeInput1Calculated, typeInput2Calculated, typeInput3Calculated, typeInput4Calculated, typeInputSingle, selectStableSingle
} from './actions'



export function useBurnStableState(): AppState['burnStables'] {
  return useSelector<AppState, AppState['burnStables']>((state) => state.burnStables)
}

export function useDerivedBurnStablesInfo(
  chainId: number,
  relevantTokenBalances: {
    [tokenAddress: string]: TokenAmount;
  },
  stablePool: StablePool,
  publicDataLoaded: boolean,
  account?: string,
): {
  parsedAmounts: {
    [StablesField.LIQUIDITY_PERCENT]: Percent
    [StablesField.LIQUIDITY]?: TokenAmount
    [StablesField.SELECTED_SINGLE]?: number
    [StablesField.CURRENCY_SINGLE]?: TokenAmount
    [StablesField.LIQUIDITY_DEPENDENT]?: TokenAmount
    [StablesField.CURRENCY_SINGLE_FEE]?: TokenAmount
    [StablesField.LIQUIDITY_SINGLE]?: TokenAmount
  },
  parsedOutputTokenAmounts: TokenAmount[],
  calculatedValuesFormatted: string[],
  error?: string
  errorSingle?: string
  liquidityTradeValues?: TokenAmount[]
} {

  const {
    independentStablesField,
    typedValue1,
    typedValue2,
    typedValue3,
    typedValue4,
    typedValueLiquidity,
    typedValueSingle,
    selectedStableSingle,
    typedValues
  } = useBurnStableState()

  // lp balance
  const userLiquidity: undefined | TokenAmount = stablePool && relevantTokenBalances?.[stablePool.liquidityToken.address ?? '']

  const poolTokens = stablePool?.tokens

  const tokens = {
    [StablesField.SELECTED_SINGLE]: selectedStableSingle,
    [StablesField.CURRENCY_SINGLE]: poolTokens?.[selectedStableSingle],
    [StablesField.LIQUIDITY]: stablePool?.liquidityToken,
  }

  // liquidity values
  const totalSupply = !publicDataLoaded ? BigNumber.from(0) : stablePool.lpTotalSupply


  // default values are set here
  let percentToRemove: Percent = new Percent('0', '100')
  let stableAmountsFromLp = [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)]
  let liquidityAmount = BigNumber.from(0)
  let calculatedValuesFormatted = [typedValue1, typedValue2, typedValue3, typedValue4]
  let feeFinal = tokens[StablesField.CURRENCY_SINGLE] && new TokenAmount(tokens[StablesField.CURRENCY_SINGLE], BigNumber.from(0).toBigInt())
  let singleAmount = BigNumber.from(0)


  const independentAmounts = poolTokens?.map((t, index) => tryParseAmount(chainId, typedValues[index] === '' ? '0' : typedValues[index], t))

  const independentLpAmount = tryParseAmount(chainId, typedValueLiquidity === '' ? '0' : typedValueLiquidity, tokens[StablesField.LIQUIDITY])
  const singleLpAmount = tryParseAmount(chainId, typedValueSingle === '' ? '0' : typedValueSingle, stablePool?.liquidityToken)

  // user specified a %
  if (independentStablesField === StablesField.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValueLiquidity, '100')

    if (stablePool && percentToRemove.greaterThan('0')) {
      stableAmountsFromLp = stablePool.calculateRemoveLiquidity( // BigNumber.from(percentToRemove.multiply(userLiquidity))
        BigNumber.from(percentToRemove.numerator).mul(userLiquidity.toBigNumber()).div(BigNumber.from(percentToRemove.denominator)
        )
      )

      calculatedValuesFormatted = stableAmountsFromLp.map(
        (amount, index) => new TokenAmount(poolTokens[index], amount.toBigInt())
      ).map(amount => amount.toSignificant(6))


      const { dy: singleAmountCalculated, fee } = stablePool.calculateRemoveLiquidityOneToken(
        BigNumber.from(percentToRemove.numerator).mul(userLiquidity.toBigNumber()).div(BigNumber.from(percentToRemove.denominator)),
        selectedStableSingle
      )
      feeFinal = new TokenAmount(tokens[StablesField.CURRENCY_SINGLE], fee.toBigInt())
      singleAmount = singleAmountCalculated

    }
  }
  // user specified a specific amount of liquidity tokens
  else if (independentStablesField === StablesField.LIQUIDITY) {
    if (stablePool && independentLpAmount) {
      stableAmountsFromLp = stablePool.calculateRemoveLiquidity(
        independentLpAmount.toBigNumber()
      )
      calculatedValuesFormatted = stableAmountsFromLp.map(
        (amount, index) => new TokenAmount(poolTokens[index], amount.toBigInt())
      ).map(amount => amount.toSignificant(6))

      if (stableAmountsFromLp && userLiquidity && !independentLpAmount.greaterThan(userLiquidity)) {
        percentToRemove = new Percent(independentLpAmount.raw, userLiquidity.raw)
      }

      const { dy: singleAmountCalculated, fee } = stablePool.calculateRemoveLiquidityOneToken(
        independentLpAmount.toBigNumber(),
        selectedStableSingle
      )
      feeFinal = new TokenAmount(tokens[StablesField.CURRENCY_SINGLE], fee.toBigInt())
      singleAmount = singleAmountCalculated

    }

  }
  // user specified a specific amount of tokens in the pool
  // this can hapen fully idependently from each other
  else
    if (stablePool) {
      liquidityAmount = stablePool.getLiquidityAmount(
        independentAmounts?.map(a => a.raw),
        false // false for withdrawl
      )
      percentToRemove = liquidityAmount.gte(totalSupply) ? new Percent('100', '100') : new Percent(liquidityAmount.toBigInt(), totalSupply.toBigInt())

    }

  // create the cases for the single stables amount inputs
  const finalSingleAmounts = (independentStablesField === StablesField.LIQUIDITY || independentStablesField === StablesField.LIQUIDITY_PERCENT) ?
    stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0') && stableAmountsFromLp?.map((am, index) => new TokenAmount(poolTokens[index], am))
    : // cases when single stable amounts are provided
    stablePool && independentAmounts !== undefined && independentAmounts?.map((am, i) => new TokenAmount(poolTokens[i], am?.raw ?? '0'))

  const finalLiquidityAmount = (independentStablesField === StablesField.LIQUIDITY_PERCENT) ?
    userLiquidity?.raw !== undefined && percentToRemove && percentToRemove.greaterThan('0')
      ? new TokenAmount(stablePool.liquidityToken, percentToRemove.multiply(userLiquidity.raw).quotient)
      : undefined :
    independentLpAmount as TokenAmount

  // finally the output is put together
  const parsedAmounts: {
    [StablesField.LIQUIDITY_PERCENT]: Percent
    [StablesField.LIQUIDITY]?: TokenAmount
    [StablesField.LIQUIDITY_DEPENDENT]?: TokenAmount
    [StablesField.CURRENCY_SINGLE_FEE]?: TokenAmount
    [StablesField.LIQUIDITY_SINGLE]?: TokenAmount
    [StablesField.SELECTED_SINGLE]?: number
    [StablesField.CURRENCY_SINGLE]?: TokenAmount
  } = {
    [StablesField.LIQUIDITY_PERCENT]: percentToRemove,
    [StablesField.LIQUIDITY]: finalLiquidityAmount,
    [StablesField.LIQUIDITY_DEPENDENT]:
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0') && liquidityAmount
        ? new TokenAmount(stablePool.liquidityToken, liquidityAmount.toBigInt())
        : undefined,
    [StablesField.CURRENCY_SINGLE_FEE]: feeFinal,
    [StablesField.LIQUIDITY_SINGLE]: wrappedCurrencyAmount(singleLpAmount, chainId),
    [StablesField.SELECTED_SINGLE]: selectedStableSingle,
    [StablesField.CURRENCY_SINGLE]: tokens[StablesField.CURRENCY_SINGLE] && new TokenAmount(tokens[StablesField.CURRENCY_SINGLE], singleAmount.toBigInt())
  }

  let error: string | undefined
  let errorSingle: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[StablesField.LIQUIDITY]) {
    error = error ?? 'Enter an amount'
  }
  if (!parsedAmounts[StablesField.LIQUIDITY_SINGLE] || !parsedAmounts[StablesField.CURRENCY_SINGLE]) {
    errorSingle = errorSingle ?? 'Enter an amount'
  }

  const newPool = stablePool?.clone()
  if (newPool && finalSingleAmounts[0] !== undefined) {
    newPool.setTokenBalances(newPool.getBalances().map((val, index) => val.sub(finalSingleAmounts[index].toBigNumber())))
  }

  const liquidityValues = stablePool &&
    totalSupply &&
    userLiquidity && tokens && finalSingleAmounts &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    totalSupply.gte(userLiquidity.toBigNumber()) && poolTokens?.map((_, i) => stablePool?.getLiquidityValue(0, finalSingleAmounts?.map((amnt) => amnt.toBigNumber())))

  return {
    parsedAmounts,
    error,
    calculatedValuesFormatted,
    errorSingle,
    liquidityTradeValues: liquidityValues,
    parsedOutputTokenAmounts: finalSingleAmounts
  }
}

export function useBurnStablesActionHandlers(): {
  onField1Input: (stablesField: StablesField, typedValue1: string) => void,
  onField2Input: (stablesField: StablesField, typedValue2: string) => void,
  onField3Input: (stablesField: StablesField, typedValue3: string) => void,
  onField4Input: (stablesField: StablesField, typedValue4: string) => void,
  onLpInput: (stablesField: StablesField, typedValueLp: string) => void,
  onLpInputSetOthers: (typedValues: string[]) => void,
  onSingleFieldInput: (stablesField: StablesField, typedValueSingle: string) => void,
  onField1CalcInput: (stablesField: StablesField, typedValue1: string, calculatedValues: string[]) => void,
  onField2CalcInput: (stablesField: StablesField, typedValue2: string, calculatedValues: string[]) => void,
  onField3CalcInput: (stablesField: StablesField, typedValue3: string, calculatedValues: string[]) => void,
  onField4CalcInput: (stablesField: StablesField, typedValue4: string, calculatedValues: string[]) => void,
  onSelectStableSingle: (selectedStableSingle: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onField1Input = useCallback(
    (stablesField: StablesField, typedValue1: string) => {
      dispatch(typeInput1({
        stablesField,
        typedValue1
      }))
    },
    [dispatch],
  )
  const onField2Input = useCallback(
    (stablesField: StablesField, typedValue2: string) => {
      dispatch(typeInput2({
        stablesField,
        typedValue2
      }))
    },
    [dispatch],
  )
  const onField3Input = useCallback(
    (stablesField: StablesField, typedValue3: string) => {
      dispatch(typeInput3({
        stablesField,
        typedValue3
      }))
    },
    [dispatch],
  )
  const onField4Input = useCallback(
    (stablesField: StablesField, typedValue4: string) => {
      dispatch(typeInput4({
        stablesField,
        typedValue4
      }))
    },
    [dispatch],
  )
  const onLpInput = useCallback(
    (stablesField: StablesField, typedValueLp: string) => {
      dispatch(typeInputLp({
        stablesField,
        typedValueLp
      }))
    },
    [dispatch],
  )

  const onSingleFieldInput = useCallback(
    (stablesField: StablesField, typedValueSingle: string) => {
      dispatch(typeInputSingle({
        stablesField,
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

  const onField1CalcInput = useCallback(
    (stablesField: StablesField, typedValue1: string, calculatedValues: string[]) => {
      dispatch(typeInput1Calculated({
        stablesField,
        typedValue1,
        calculatedValues
      }))
    },
    [dispatch],
  )

  const onField2CalcInput = useCallback(
    (stablesField: StablesField, typedValue2: string, calculatedValues: string[]) => {
      dispatch(typeInput2Calculated({
        stablesField,
        typedValue2,
        calculatedValues
      }))
    },
    [dispatch],
  )

  const onField3CalcInput = useCallback(
    (stablesField: StablesField, typedValue3: string, calculatedValues: string[]) => {
      dispatch(typeInput3Calculated({
        stablesField,
        typedValue3,
        calculatedValues
      }))
    },
    [dispatch],
  )

  const onField4CalcInput = useCallback(
    (stablesField: StablesField, typedValue4: string, calculatedValues: string[]) => {
      dispatch(typeInput4Calculated({
        stablesField,
        typedValue4,
        calculatedValues
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
    onField1Input, onField2Input, onField3Input, onField4Input, onLpInput, onLpInputSetOthers,
    onSingleFieldInput,
    onField1CalcInput, onField2CalcInput, onField3CalcInput, onField4CalcInput,
    onSelectStableSingle
  }
}
