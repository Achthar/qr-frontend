import { CurrencyAmount, JSBI, Pair, Percent, TokenAmount, StablePool, Token, STABLE_POOL_LP_ADDRESS } from '@pancakeswap/sdk'
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
    stablePool?.tokens[0],
    stablePool?.tokens[1],
    stablePool?.tokens[2],
    stablePool?.tokens[3]],
  )

  const userBalances = stablePool &&
    relevantTokenBalances ? [stablePool?.tokens[0],
    stablePool?.tokens[1],
    stablePool?.tokens[2],
    stablePool?.tokens[3]].map((token, index) => relevantTokenBalances[token.address]?.toBigNumber()) : undefined

  console.log("RTB", relevantTokenBalances)
  console.log("userbasl", userBalances)
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[stablePool?.liquidityToken?.address ?? '']


  const tokens = {
    [StablesField.CURRENCY_1]: stablePool?.tokens[0],
    [StablesField.CURRENCY_2]: stablePool?.tokens[1],
    [StablesField.CURRENCY_3]: stablePool?.tokens[2],
    [StablesField.CURRENCY_4]: stablePool?.tokens[3],
    [StablesField.SELECTED_SINGLE]: selectedStableSingle,
    [StablesField.CURRENCY_SINGLE]: stablePool?.tokens[selectedStableSingle],
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
  // user specified a %
  if (independentStablesField === StablesField.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValueLiquidity, '100')
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
    const independentAmount1 = tryParseAmount(chainId, typedValue1, tokens[0])
    const independentAmount2 = tryParseAmount(chainId, typedValue2, tokens[1])
    const independentAmount3 = tryParseAmount(chainId, typedValue3, tokens[2])
    const independentAmount4 = tryParseAmount(chainId, typedValue4, tokens[3])

    if (stablePool && independentAmount1 && independentAmount2 &&
      independentAmount3 && independentAmount4 && liquidityValues) {
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
      tokens && percentToRemove && percentToRemove.greaterThan('0') && liquidityValue1
        ? new TokenAmount(tokens[0], percentToRemove.multiply(liquidityValue1.raw).quotient)
        : undefined,
    [StablesField.CURRENCY_2]:
      tokens && percentToRemove && percentToRemove.greaterThan('0') && liquidityValue2
        ? new TokenAmount(tokens[1], percentToRemove.multiply(liquidityValue2.raw).quotient)
        : undefined,
    [StablesField.CURRENCY_3]:
      tokens && percentToRemove && percentToRemove.greaterThan('0') && liquidityValue3
        ? new TokenAmount(tokens[2], percentToRemove.multiply(liquidityValue3.raw).quotient)
        : undefined,
    [StablesField.CURRENCY_4]:
      tokens && percentToRemove && percentToRemove.greaterThan('0') && liquidityValue4
        ? new TokenAmount(tokens[3], percentToRemove.multiply(liquidityValue4.raw).quotient)
        : undefined,
  }

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
  onField1Input: (typedValue1: string) => void,
  onField2Input: (typedValue2: string) => void,
  onField3Input: (typedValue3: string) => void,
  onField4Input: (typedValue4: string) => void,
  onLpInput: (stablesField: StablesField, typedValueLp: string) => void,
} {
  const dispatch = useDispatch<AppDispatch>()

  const onField1Input = useCallback(
    (typedValue1: string) => {
      dispatch(typeInput1({
        stablesField: StablesField.CURRENCY_1,
        typedValue1
      }))
    },
    [dispatch],
  )
  const onField2Input = useCallback(
    (typedValue2: string) => {
      dispatch(typeInput2({
        stablesField: StablesField.CURRENCY_2,
        typedValue2
      }))
    },
    [dispatch],
  )
  const onField3Input = useCallback(
    (typedValue3: string) => {
      dispatch(typeInput3({
        stablesField: StablesField.CURRENCY_3,
        typedValue3
      }))
    },
    [dispatch],
  )
  const onField4Input = useCallback(
    (typedValue4: string) => {
      dispatch(typeInput4({
        stablesField: StablesField.CURRENCY_4,
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
