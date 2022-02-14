import { Percent, TokenAmount, StablePool, Token, STABLE_POOL_LP_ADDRESS, STABLES_INDEX_MAP } from '@requiemswap/sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { StablePoolState } from 'hooks/useStablePool'
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
    [StablesField.CURRENCY_1]?: TokenAmount
    [StablesField.CURRENCY_2]?: TokenAmount
    [StablesField.CURRENCY_3]?: TokenAmount
    [StablesField.CURRENCY_4]?: TokenAmount
    [StablesField.SELECTED_SINGLE]?: number
    [StablesField.CURRENCY_SINGLE]?: TokenAmount
    [StablesField.LIQUIDITY_DEPENDENT]?: TokenAmount
    [StablesField.CURRENCY_SINGLE_FEE]?: TokenAmount
    [StablesField.LIQUIDITY_SINGLE]?: TokenAmount
  }
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
  } = useBurnStableState()

  const lpToken = new Token(chainId, STABLE_POOL_LP_ADDRESS[chainId ?? 43113], 18, 'RequiemStable-LP', 'Requiem StableSwap LPs')

  // lp balance
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[getAddress(STABLE_POOL_LP_ADDRESS[chainId ?? 43113]) ?? '']


  const tokens = {
    [StablesField.CURRENCY_1]: STABLES_INDEX_MAP[chainId][0],
    [StablesField.CURRENCY_2]: STABLES_INDEX_MAP[chainId][1],
    [StablesField.CURRENCY_3]: STABLES_INDEX_MAP[chainId][2],
    [StablesField.CURRENCY_4]: STABLES_INDEX_MAP[chainId][3],
    [StablesField.SELECTED_SINGLE]: selectedStableSingle,
    [StablesField.CURRENCY_SINGLE]: STABLES_INDEX_MAP[chainId][selectedStableSingle],
    [StablesField.LIQUIDITY]: lpToken,
  }
  // liquidity values
  const totalSupply = !publicDataLoaded ? BigNumber.from(0) : stablePool.lpTotalSupply

  // default values are set here
  let percentToRemove: Percent = new Percent('0', '100')
  let stableAmountsFromLp = [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)]
  let liquidityAmount = BigNumber.from(0)
  let calculatedValuesFormatted = [typedValue1, typedValue2, typedValue3, typedValue4]
  let feeFinal = new TokenAmount(tokens[StablesField.CURRENCY_SINGLE], BigNumber.from(0).toBigInt())
  let singleAmount = BigNumber.from(0)

  const independentAmount1 = tryParseAmount(chainId, typedValue1 === '' ? '0' : typedValue1, tokens[StablesField.CURRENCY_1])
  const independentAmount2 = tryParseAmount(chainId, typedValue2 === '' ? '0' : typedValue2, tokens[StablesField.CURRENCY_2])
  const independentAmount3 = tryParseAmount(chainId, typedValue3 === '' ? '0' : typedValue3, tokens[StablesField.CURRENCY_3])
  const independentAmount4 = tryParseAmount(chainId, typedValue4 === '' ? '0' : typedValue4, tokens[StablesField.CURRENCY_4])

  const independentLpAmount = tryParseAmount(chainId, typedValueLiquidity === '' ? '0' : typedValueLiquidity, tokens[StablesField.LIQUIDITY])
  const singleLpAmount = tryParseAmount(chainId, typedValueSingle === '' ? '0' : typedValueSingle, lpToken)

  // user specified a %
  if (independentStablesField === StablesField.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValueLiquidity, '100')

    if (stablePool && percentToRemove.greaterThan('0')) {
      stableAmountsFromLp = stablePool.calculateRemoveLiquidity( // BigNumber.from(percentToRemove.multiply(userLiquidity))
        BigNumber.from(percentToRemove.numerator).mul(userLiquidity.toBigNumber()).div(BigNumber.from(percentToRemove.denominator)
        )
      )

      calculatedValuesFormatted = stableAmountsFromLp.map(
        (amount, index) => new TokenAmount(STABLES_INDEX_MAP[chainId][index], amount.toBigInt())
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
        (amount, index) => new TokenAmount(STABLES_INDEX_MAP[chainId][index], amount.toBigInt())
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
        [
          independentAmount1 === undefined ? BigNumber.from(0) : wrappedCurrencyAmount(independentAmount1, chainId).toBigNumber(),
          independentAmount2 === undefined ? BigNumber.from(0) : wrappedCurrencyAmount(independentAmount2, chainId).toBigNumber(),
          independentAmount3 === undefined ? BigNumber.from(0) : wrappedCurrencyAmount(independentAmount3, chainId).toBigNumber(),
          independentAmount4 === undefined ? BigNumber.from(0) : wrappedCurrencyAmount(independentAmount4, chainId).toBigNumber()

        ],
        false // false for withdrawl
      )
      percentToRemove = liquidityAmount.gte(totalSupply) ? new Percent('100', '100') : new Percent(liquidityAmount.toBigInt(), totalSupply.toBigInt())

    }

  // create the cases for the single stables amount inputs
  const finalSingleAmounts = (independentStablesField === StablesField.LIQUIDITY || independentStablesField === StablesField.LIQUIDITY_PERCENT) ?
    [
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_1], stableAmountsFromLp[0].toBigInt())
        : undefined,
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_2], stableAmountsFromLp[1].toBigInt())
        : undefined,
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_3], stableAmountsFromLp[2].toBigInt())
        : undefined,
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_4], stableAmountsFromLp[3].toBigInt())
        : undefined,
    ] : // cases when single stable amounts are provided
    [
      stablePool && independentAmount1 !== undefined
        ? new TokenAmount(tokens[StablesField.CURRENCY_1], independentAmount1.raw)
        : undefined,
      stablePool && independentAmount2 !== undefined
        ? new TokenAmount(tokens[StablesField.CURRENCY_2], independentAmount2.raw)
        : undefined,
      stablePool && independentAmount3 !== undefined
        ? new TokenAmount(tokens[StablesField.CURRENCY_3], independentAmount3.raw)
        : undefined,
      stablePool && independentAmount4 !== undefined
        ? new TokenAmount(tokens[StablesField.CURRENCY_4], independentAmount4.raw)
        : undefined,
    ]

  const finalLiquidityAmount = (independentStablesField === StablesField.LIQUIDITY_PERCENT) ?
    userLiquidity?.raw !== undefined && percentToRemove && percentToRemove.greaterThan('0')
      ? new TokenAmount(lpToken, percentToRemove.multiply(userLiquidity.raw).quotient)
      : undefined :
    independentLpAmount as TokenAmount

  // finally the output is put together
  const parsedAmounts: {
    [StablesField.LIQUIDITY_PERCENT]: Percent
    [StablesField.LIQUIDITY]?: TokenAmount
    [StablesField.CURRENCY_1]?: TokenAmount
    [StablesField.CURRENCY_2]?: TokenAmount
    [StablesField.CURRENCY_3]?: TokenAmount
    [StablesField.CURRENCY_4]?: TokenAmount
    [StablesField.LIQUIDITY_DEPENDENT]?: TokenAmount
    [StablesField.CURRENCY_SINGLE_FEE]?: TokenAmount
    [StablesField.LIQUIDITY_SINGLE]?: TokenAmount
    [StablesField.SELECTED_SINGLE]?: number
    [StablesField.CURRENCY_SINGLE]?: TokenAmount
  } = {
    [StablesField.LIQUIDITY_PERCENT]: percentToRemove,
    [StablesField.LIQUIDITY]: finalLiquidityAmount,
    [StablesField.CURRENCY_1]: finalSingleAmounts[0],
    [StablesField.CURRENCY_2]: finalSingleAmounts[1],
    [StablesField.CURRENCY_3]: finalSingleAmounts[2],
    [StablesField.CURRENCY_4]: finalSingleAmounts[3],
    [StablesField.LIQUIDITY_DEPENDENT]:
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0') && liquidityAmount
        ? new TokenAmount(lpToken, liquidityAmount.toBigInt())
        : undefined,
    [StablesField.CURRENCY_SINGLE_FEE]: feeFinal,
    [StablesField.LIQUIDITY_SINGLE]: wrappedCurrencyAmount(singleLpAmount, chainId),
    [StablesField.SELECTED_SINGLE]: selectedStableSingle,
    [StablesField.CURRENCY_SINGLE]: new TokenAmount(tokens[StablesField.CURRENCY_SINGLE], singleAmount.toBigInt())
  }

  let error: string | undefined
  let errorSingle: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[StablesField.LIQUIDITY] || !parsedAmounts[StablesField.CURRENCY_1] || !parsedAmounts[StablesField.CURRENCY_2]
    || !parsedAmounts[StablesField.CURRENCY_3] || !parsedAmounts[StablesField.CURRENCY_4]) {
    error = error ?? 'Enter an amount'
  }
  if (!parsedAmounts[StablesField.LIQUIDITY_SINGLE] || !parsedAmounts[StablesField.CURRENCY_SINGLE]) {
    errorSingle = errorSingle ?? 'Enter an amount'
  }

  const newPool = stablePool?.clone()
  if (newPool && finalSingleAmounts[0] !== undefined) {
    newPool.setTokenBalances(newPool.getBalances().map((val, index) => val.sub(finalSingleAmounts[index].toBigNumber())))
  }

  const liquidityValue1 =
    stablePool &&
      totalSupply &&
      userLiquidity &&
      finalSingleAmounts[0] !== undefined &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? newPool.getLiquidityValue(0, finalSingleAmounts.map((amnt) => amnt.toBigNumber()))
      : undefined
  const liquidityValue2 =
    stablePool &&
      totalSupply &&
      finalSingleAmounts[1] !== undefined &&
      userLiquidity &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? newPool.getLiquidityValue(1, finalSingleAmounts.map((amnt) => amnt.toBigNumber()))
      : undefined

  const liquidityValue3 =
    stablePool &&
      totalSupply &&
      finalSingleAmounts[0] !== undefined &&
      userLiquidity &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? newPool.getLiquidityValue(2, finalSingleAmounts.map((amnt) => amnt.toBigNumber()))
      : undefined

  const liquidityValue4 =
    stablePool &&
      totalSupply &&
      finalSingleAmounts[0] !== undefined &&
      userLiquidity &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? newPool.getLiquidityValue(3, finalSingleAmounts.map((amnt) => amnt.toBigNumber()))
      : undefined

  // the value of the LP in the respective ccy 
  // const liquidityValues: { [StablesField.CURRENCY_1]?: TokenAmount;[StablesField.CURRENCY_2]?: TokenAmount;[StablesField.CURRENCY_3]?: TokenAmount;[StablesField.CURRENCY_4]?: TokenAmount } = {
  //   [StablesField.CURRENCY_1]: liquidityValue1,
  //   [StablesField.CURRENCY_2]: liquidityValue2,
  //   [StablesField.CURRENCY_3]: liquidityValue3,
  //   [StablesField.CURRENCY_4]: liquidityValue4,
  // }

  const liquidityTradeValues = [liquidityValue1, liquidityValue2, liquidityValue3, liquidityValue4]
  return {
    // stablePool, 
    parsedAmounts,
    error, calculatedValuesFormatted, errorSingle, liquidityTradeValues
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
