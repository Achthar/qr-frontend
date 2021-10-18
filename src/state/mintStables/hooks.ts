/* eslint object-shorthand: 0 */
import { parseUnits } from '@ethersproject/units'
import { formatFixed, parseFixed } from "@ethersproject/bignumber";
import { Currency, CurrencyAmount, ETHER, JSBI, NETWORK_CCY, StablePool, Percent, Price, TokenAmount, STABLES_INDEX_MAP, Token } from '@pancakeswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { StablePoolState, useStablePool } from 'hooks/useStablePool'
import { BigNumber } from 'ethers'
import useTotalSupply from 'hooks/useTotalSupply'
import { simpleRpcProvider } from 'utils/providers'
import { wrappedCurrency, wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useCurrencyBalances } from '../wallet/hooks'
import { StablesField, typeInput1, typeInput2, typeInput3, typeInput4, typeInputs } from './actions'


const ZERO = JSBI.BigInt(0)


// try to parse a user entered amount for a given token
export function tryParseStablesAmount(value?: string, currency?: Currency): BigNumber | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return BigNumber.from(typedValueParsed)
    }
  } catch (error: any) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

export function useMintStablesState(): AppState['mintStables'] {
  return useSelector<AppState, AppState['mintStables']>((state) => state.mintStables)
}

export function useMintStablesActionHandlers(): {
  onField1Input: (typedValue1: string) => void,
  onField2Input: (typedValue2: string) => void,
  onField3Input: (typedValue3: string) => void,
  onField4Input: (typedValue4: string) => void,
} {
  const dispatch = useDispatch<AppDispatch>()

  const onField1Input = useCallback(
    (typedValue1: string) => {
      dispatch(typeInput1({
        typedValue1: typedValue1
      }))
    },
    [dispatch],
  )
  const onField2Input = useCallback(
    (typedValue2: string) => {
      dispatch(typeInput2({
        typedValue2: typedValue2
      }))
    },
    [dispatch],
  )
  const onField3Input = useCallback(
    (typedValue3: string) => {
      dispatch(typeInput3({
        typedValue3: typedValue3
      }))
    },
    [dispatch],
  )
  const onField4Input = useCallback(
    (typedValue4: string) => {
      dispatch(typeInput4({
        typedValue4: typedValue4
      }))
    },
    [dispatch],
  )
  return { onField1Input, onField2Input, onField3Input, onField4Input }
}

export function useDerivedMintStablesInfo(
  currency1: Currency,
  currency2: Currency,
  currency3: Currency | undefined,
  currency4: Currency | undefined,
): {
  stableCurrencies: { [field in StablesField]?: Currency }
  stablePool?: StablePool | null
  stablePoolState: StablePoolState
  stablesCurrencyBalances: { [field in StablesField]?: CurrencyAmount }
  parsedStablesAmounts: { [field in StablesField]?: CurrencyAmount }
  stablesLiquidityMinted?: TokenAmount
  stablesPoolTokenPercentage?: Percent
  stablesError?: string
} {
  const { account, chainId } = useActiveWeb3React()

  const { typedValue1, typedValue2, typedValue3, typedValue4 } = useMintStablesState()
  // const typedValues = [typedValue1, typedValue2, typedValue3, typedValue4]
  // tokens
  const stableCurrencies: { [field in StablesField]?: Currency } = useMemo(
    () => ({
      [StablesField.CURRENCY_1]: currency1,
      [StablesField.CURRENCY_2]: currency2,
      [StablesField.CURRENCY_3]: currency3 ?? undefined,
      [StablesField.CURRENCY_4]: currency4 ?? undefined,
    }),
    [currency1, currency2, currency3, currency4],
  )

  // stablesPair
  const [stablePoolState, stablePool] = useStablePool()

  // stablePool?.setBlockTimestamp(BigNumber.from(simpleRpcProvider(chainId ?? 43113).blockNumber))

  const totalSupply = stablePool === null ? BigNumber.from(0) : stablePool.lpTotalSupply //   useTotalSupply(stablePool?.liquidityToken)

  // balances
  const balances = useCurrencyBalances(chainId, account ?? undefined, [
    stableCurrencies[StablesField.CURRENCY_1],
    stableCurrencies[StablesField.CURRENCY_2],
    stableCurrencies[StablesField.CURRENCY_3],
    stableCurrencies[StablesField.CURRENCY_4],
  ])

  const fieldList = [
    StablesField.CURRENCY_1,
    StablesField.CURRENCY_2,
    StablesField.CURRENCY_3,
    StablesField.CURRENCY_4,
  ]


  const stablesCurrencyBalances: { [field in StablesField]?: CurrencyAmount } = {
    [StablesField.CURRENCY_1]: balances[0],
    [StablesField.CURRENCY_2]: balances[1],
    [StablesField.CURRENCY_3]: balances[2],
    [StablesField.CURRENCY_4]: balances[3]
  }

  // amounts
  // const parsedStablesAmounts: { [field in StablesField]?: CurrencyAmount } | undefined = useMemo(() =>
  // ({
  //   [StablesField.CURRENCY_1]: tryParseAmount(chainId, typedValue1, stableCurrencies[0]),
  //   [StablesField.CURRENCY_2]: tryParseAmount(chainId, typedValue2, stableCurrencies[1]),
  //   [StablesField.CURRENCY_3]: tryParseAmount(chainId, typedValue3, stableCurrencies[2]),
  //   [StablesField.CURRENCY_4]: tryParseAmount(chainId, typedValue4, stableCurrencies[3])
  // }), [typedValue1, typedValue2, typedValue3, typedValue4, chainId, stableCurrencies]
  // )
  // console.log("typed", typedValues)

  const parsedStablesAmount1: CurrencyAmount | undefined = tryParseAmount(chainId, typedValue1 === '' ? '0' : typedValue1, STABLES_INDEX_MAP[chainId][0])

  const parsedStablesAmount2: CurrencyAmount | undefined = tryParseAmount(chainId, typedValue2 === '' ? '0' : typedValue2, STABLES_INDEX_MAP[chainId][1])

  const parsedStablesAmount3: CurrencyAmount | undefined = tryParseAmount(chainId, typedValue3 === '' ? '0' : typedValue3, STABLES_INDEX_MAP[chainId][2])

  const parsedStablesAmount4: CurrencyAmount | undefined = tryParseAmount(chainId, typedValue4 === '' ? '0' : typedValue4, STABLES_INDEX_MAP[chainId][3])

  console.log("parsedAmount1", parsedStablesAmount1)

  /* Object.assign({},
    ...fieldList.map((_, index) => ({ [fieldList[index]]: tryParseAmount(chainId, typedValues[index], stableCurrencies[index]) }))); */


  // liquidity minted
  const stablesLiquidityMinted = useMemo(() => {
    const typedValues = [typedValue1, typedValue2, typedValue3, typedValue4]
    const input = Object.values(STABLES_INDEX_MAP[chainId ?? 43113]).map((_, index) => BigNumber.from(typedValues[index] === '' ? '0' : typedValues[index]))
    // const tokenAmounts = [parsedStablesAmount1, parsedStablesAmount2,
    //   parsedStablesAmount3, parsedStablesAmount4].map(amount => wrappedCurrencyAmount(amount, chainId))
    // console.log("parsed Amounts:", tokenAmounts)
    if (stablePool && totalSupply) {
      return stablePool.getLiquidityMinted( // BigNumber.from(0)
        input,
        true)
    }
    return undefined
  }, [typedValue1, typedValue2, typedValue3, typedValue4, stablePool, totalSupply, chainId])


  const stablesPoolTokenPercentage = useMemo(() => {
    if (stablesLiquidityMinted && totalSupply) {
      if (stablesLiquidityMinted.eq(0)) {
        return new Percent(BigInt(0), BigInt(1))
      }

      return new Percent(stablesLiquidityMinted.toBigInt(), (totalSupply.add(stablesLiquidityMinted)).toBigInt())
    }
    return undefined
  }, [stablesLiquidityMinted, totalSupply])

  let stablesError: string | undefined
  if (!account) {
    stablesError = 'Connect Wallet'
  }

  if (!parsedStablesAmount1 || !parsedStablesAmount2
    || !parsedStablesAmount3 || !parsedStablesAmount4) {
    stablesError = stablesError ?? 'Enter an amount'
  }



  // const { [StablesField.CURRENCY_1]: currency1Amount, [StablesField.CURRENCY_2]: currency2Amount,
  //   [StablesField.CURRENCY_3]: currency3Amount, [StablesField.CURRENCY_4]: currency4Amount } = parsedStablesAmounts

  if (parsedStablesAmount1 && stablesCurrencyBalances?.[StablesField.CURRENCY_1]?.lessThan(parsedStablesAmount1)) {
    stablesError = `Insufficient ${stableCurrencies[StablesField.CURRENCY_1]?.symbol} balance`
  }

  if (parsedStablesAmount2 && stablesCurrencyBalances?.[StablesField.CURRENCY_2]?.lessThan(parsedStablesAmount2)) {
    stablesError = `Insufficient ${stableCurrencies[StablesField.CURRENCY_2]?.symbol} balance`
  }
  if (parsedStablesAmount3 && stablesCurrencyBalances?.[StablesField.CURRENCY_3]?.lessThan(parsedStablesAmount3)) {
    stablesError = `Insufficient ${stableCurrencies[StablesField.CURRENCY_3]?.symbol} balance`
  }
  if (parsedStablesAmount4 && stablesCurrencyBalances?.[StablesField.CURRENCY_4]?.lessThan(parsedStablesAmount4)) {
    stablesError = `Insufficient ${stableCurrencies[StablesField.CURRENCY_4]?.symbol} balance`
  }

  const parsedStablesAmounts =
  {
    [StablesField.CURRENCY_1]: parsedStablesAmount1,
    [StablesField.CURRENCY_2]: parsedStablesAmount2,
    [StablesField.CURRENCY_3]: parsedStablesAmount3,
    [StablesField.CURRENCY_4]: parsedStablesAmount4
  }

  return {
    stableCurrencies,
    stablePool,
    stablePoolState,
    stablesCurrencyBalances,
    parsedStablesAmounts,
    stablesLiquidityMinted: stablePool === null ? null : new TokenAmount(stablePool.liquidityToken, stablesLiquidityMinted === undefined ? ZERO : stablesLiquidityMinted.toBigInt()),
    stablesPoolTokenPercentage,
    stablesError,
  }
}