import { CurrencyAmount, JSBI, Pair, Percent, TokenAmount, StablePool, Token, STABLE_POOL_LP_ADDRESS, STABLES_INDEX_MAP } from '@pancakeswap/sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useStablePool } from 'hooks/useStablePool'
import useTotalSupply from 'hooks/useTotalSupply'
import { BigNumber } from 'ethers'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
// import { useTokenBalances } from '../wallet/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../wallet/hooks'
import { StablesField, typeInput1, typeInput2, typeInput3, typeInput4, typeInputLp } from './actions'

export function useBurnStableState(): AppState['burnStables'] {
  return useSelector<AppState, AppState['burnStables']>((state) => state.burnStables)
}

export function useDerivedBurnStablesInfo(
): {
  parsedAmounts: {
    [StablesField.LIQUIDITY_PERCENT]: Percent
    [StablesField.LIQUIDITY]?: TokenAmount
    [StablesField.CURRENCY_1]?: CurrencyAmount
    [StablesField.CURRENCY_2]?: CurrencyAmount
    [StablesField.CURRENCY_3]?: CurrencyAmount
    [StablesField.CURRENCY_4]?: CurrencyAmount
    [StablesField.SELECTED_SINGLE]?: number
    [StablesField.CURRENCY_SINGLE]?: CurrencyAmount
  }
  error?: string
  stablePool: StablePool
} {
  const { account, chainId } = useActiveWeb3React()

  const {
    independentStablesField,
    typedValue1,
    typedValue2,
    typedValue3,
    typedValue4,
    typedValueLiquidity,
    typedValueSingle,
    selectedStableSingle
  } = useBurnStableState()

  // pair + totalsupply
  const [stablePoolState, stablePool] = useStablePool()

  // balances
  // const relevantTokenBalances = useTokenBalances(account ?? undefined, [stablePool?.liquidityToken])

  const [relevantTokenBalances, fetchingUserPoolBalance] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    [new Token(chainId, STABLE_POOL_LP_ADDRESS[chainId ?? 43113], 18, 'RequiemStable-LP', 'Requiem StableSwap LPs'),
    STABLES_INDEX_MAP[chainId][0],
    STABLES_INDEX_MAP[chainId][1],
    STABLES_INDEX_MAP[chainId][2],
    STABLES_INDEX_MAP[chainId][3]],
  )

 
  const userBalances = stablePool &&
    relevantTokenBalances ? [STABLES_INDEX_MAP[chainId][0],
    STABLES_INDEX_MAP[chainId][1],
    STABLES_INDEX_MAP[chainId][2],
    STABLES_INDEX_MAP[chainId][3]].map((token, index) => relevantTokenBalances[token.address]?.toBigNumber()) : undefined

  console.log("RTB", relevantTokenBalances)
  console.log("userbalances", userBalances)
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[stablePool?.liquidityToken?.address ?? '']


  const tokens = {
    [StablesField.CURRENCY_1]: STABLES_INDEX_MAP[chainId][0],
    [StablesField.CURRENCY_2]: STABLES_INDEX_MAP[chainId][1],
    [StablesField.CURRENCY_3]: STABLES_INDEX_MAP[chainId][2],
    [StablesField.CURRENCY_4]: STABLES_INDEX_MAP[chainId][3],
    [StablesField.SELECTED_SINGLE]: selectedStableSingle,
    [StablesField.CURRENCY_SINGLE]: STABLES_INDEX_MAP[chainId][selectedStableSingle],
    [StablesField.LIQUIDITY]: stablePool?.liquidityToken,
  }
  // liquidity values
  const totalSupply = stablePool === null ? BigNumber.from(0) : stablePool.lpTotalSupply// useTotalSupply(stablePool?.liquidityToken)
  const liquidityValue1 =
    stablePool &&
      totalSupply &&
      userLiquidity &&
      userBalances[0] !== undefined &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? stablePool.getLiquidityValue(0, userBalances)
      : undefined
  const liquidityValue2 =
    stablePool &&
      totalSupply &&
      userBalances[0] !== undefined &&
      userLiquidity &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? stablePool.getLiquidityValue(1, userBalances)
      : undefined

  const liquidityValue3 =
    stablePool &&
      totalSupply &&
      userBalances[0] !== undefined &&
      userLiquidity &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? stablePool.getLiquidityValue(2, userBalances)
      : undefined

  const liquidityValue4 =
    stablePool &&
      totalSupply &&
      userBalances[0] !== undefined &&
      userLiquidity &&
      tokens &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      totalSupply.gte(userLiquidity.toBigNumber())
      ? stablePool.getLiquidityValue(3, userBalances)
      : undefined

  // the value of the LP in the respective ccy 
  const liquidityValues: { [StablesField.CURRENCY_1]?: TokenAmount;[StablesField.CURRENCY_2]?: TokenAmount;[StablesField.CURRENCY_3]?: TokenAmount;[StablesField.CURRENCY_4]?: TokenAmount } = {
    [StablesField.CURRENCY_1]: liquidityValue1,
    [StablesField.CURRENCY_2]: liquidityValue2,
    [StablesField.CURRENCY_3]: liquidityValue3,
    [StablesField.CURRENCY_4]: liquidityValue4,
  }

  let percentToRemove: Percent = new Percent('0', '100')
  let stableAmountsFromLp = [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)]
  // user specified a %
  console.log("percentToRemove", percentToRemove)
  if (independentStablesField === StablesField.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValueLiquidity, '100')
    if (stablePool && percentToRemove.greaterThan('0')) {
      console.log("argument", BigNumber.from(percentToRemove.numerator).mul(userLiquidity.toBigNumber()).div(BigNumber.from(percentToRemove.denominator)))
      stableAmountsFromLp = stablePool.calculateRemoveLiquidity(
        BigNumber.from(percentToRemove.numerator).mul(userLiquidity.toBigNumber()).div(BigNumber.from(percentToRemove.denominator))
      )
    }
  }
  // user specified a specific amount of liquidity tokens
  else if (independentStablesField === StablesField.LIQUIDITY) {
    if (stablePool?.liquidityToken) {
      const independentLpAmount = tryParseAmount(chainId, typedValueLiquidity, stablePool.liquidityToken)
      if (independentLpAmount && userLiquidity && !independentLpAmount.greaterThan(userLiquidity)) {
        percentToRemove = new Percent(independentLpAmount.raw, userLiquidity.raw)
      }
    }
  }
  // user specified a specific amount of tokens in the pool
  // this can hapen fully idependently from each other
  else {
    const independentAmount1 = tryParseAmount(chainId, typedValue1, tokens[StablesField.CURRENCY_1])
    const independentAmount2 = tryParseAmount(chainId, typedValue2, tokens[StablesField.CURRENCY_2])
    const independentAmount3 = tryParseAmount(chainId, typedValue3, tokens[StablesField.CURRENCY_3])
    const independentAmount4 = tryParseAmount(chainId, typedValue4, tokens[StablesField.CURRENCY_4])

    if (stablePool) {
      const liqAmount = stablePool.getLiquidityAmount(
        [
          independentAmount1.toBigNumber(),
          independentAmount2.toBigNumber(),
          independentAmount3.toBigNumber(),
          independentAmount4.toBigNumber()

        ],
        false // false for withdrawl
      )
      percentToRemove = liqAmount.gte(totalSupply) ? new Percent('100', '100') : new Percent(liqAmount.toBigInt(), totalSupply.toBigInt())
    }
  }

  const parsedAmounts: {
    [StablesField.LIQUIDITY_PERCENT]: Percent
    [StablesField.LIQUIDITY]?: TokenAmount
    [StablesField.CURRENCY_1]?: TokenAmount
    [StablesField.CURRENCY_2]?: TokenAmount
    [StablesField.CURRENCY_3]?: TokenAmount
    [StablesField.CURRENCY_4]?: TokenAmount
  } = {
    [StablesField.LIQUIDITY_PERCENT]: percentToRemove,
    [StablesField.LIQUIDITY]:
      userLiquidity && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(userLiquidity.token, percentToRemove.multiply(userLiquidity.raw).quotient)
        : undefined,
    [StablesField.CURRENCY_1]:
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_1], stableAmountsFromLp[0].toBigInt())
        : undefined,
    [StablesField.CURRENCY_2]:
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_2], stableAmountsFromLp[1].toBigInt())
        : undefined,
    [StablesField.CURRENCY_3]:
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_3], stableAmountsFromLp[2].toBigInt())
        : undefined,
    [StablesField.CURRENCY_4]:
      stablePool && stableAmountsFromLp && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(tokens[StablesField.CURRENCY_4], stableAmountsFromLp[3].toBigInt())
        : undefined,
  }


  console.log("PA", parsedAmounts)
  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[StablesField.LIQUIDITY] || !parsedAmounts[StablesField.CURRENCY_1] || !parsedAmounts[StablesField.CURRENCY_2]
    || !parsedAmounts[StablesField.CURRENCY_3] || !parsedAmounts[StablesField.CURRENCY_4]) {
    error = error ?? 'Enter an amount'
  }

  return { stablePool, parsedAmounts, error }
}

// export function useBurnStablesActionHandlers(): {
//   onUserInput: (stablesField: StablesField, typedValue: string) => void
// } {
//   const dispatch = useDispatch<AppDispatch>()

//   const onUserInput = useCallback(
//     (stablesField: StablesField, typedValue: string) => {
//       dispatch(typeInput({ stablesField, typedValue }))
//     },
//     [dispatch],
//   )

//   return {
//     onUserInput,
//   }
// }

export function useBurnStablesActionHandlers(): {
  onField1Input: (stablesField: StablesField, typedValue1: string) => void,
  onField2Input: (stablesField: StablesField, typedValue2: string) => void,
  onField3Input: (stablesField: StablesField, typedValue3: string) => void,
  onField4Input: (stablesField: StablesField, typedValue4: string) => void,
  onLpInput: (stablesField: StablesField, typedValueLp: string) => void,
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

  return { onField1Input, onField2Input, onField3Input, onField4Input, onLpInput }
}
