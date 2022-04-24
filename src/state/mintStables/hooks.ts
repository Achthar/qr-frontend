/* eslint object-shorthand: 0 */
import { parseUnits } from '@ethersproject/units'
import { Currency, TokenAmount, ZERO, StablePool, Percent, STABLES_INDEX_MAP, Token } from '@requiemswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { StablePoolState, useStablePool } from 'hooks/useStablePool'
import { BigNumber } from 'ethers'
import useTotalSupply from 'hooks/useTotalSupply'
import { wrappedCurrency, wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swapV3/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { StablesField, typeInput1, typeInput2, typeInput3, typeInput4, typeInputs } from './actions'





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
  stablePool: StablePool,
  publicDataLoaded:boolean,
  stableCcyAmounts: TokenAmount[],
  account?: string
): {
  stableCurrencies: { [field in StablesField]?: Currency }
  stablesCurrencyBalances: { [field in StablesField]?: TokenAmount }
  parsedStablesAmounts: { [field in StablesField]?: TokenAmount }
  stablesLiquidityMinted?: TokenAmount
  stablesPoolTokenPercentage?: Percent
  stablesError?: string
} {
  // const { account, chainId } = useActiveWeb3React()

  const { typedValue1, typedValue2, typedValue3, typedValue4 } = useMintStablesState()

  const chainId = stablePool?.chainId ?? 43113
  // const typedValues = [typedValue1, typedValue2, typedValue3, typedValue4]
  // tokens
  const stableCurrencies: { [field in StablesField]?: Token } = {
    [StablesField.CURRENCY_1]: STABLES_INDEX_MAP[chainId][0],
    [StablesField.CURRENCY_2]: STABLES_INDEX_MAP[chainId][1],
    [StablesField.CURRENCY_3]: STABLES_INDEX_MAP[chainId][2],
    [StablesField.CURRENCY_4]: STABLES_INDEX_MAP[chainId][3],
  }

  // // stablesPair
  // const [stablePoolState, stablePool] = useStablePool()

  // stablePool?.setBlockTimestamp(BigNumber.from(simpleRpcProvider(chainId ?? 43113).blockNumber))

  const totalSupply = !publicDataLoaded ? BigNumber.from(0) : stablePool.lpTotalSupply //   useTotalSupply(stablePool?.liquidityToken)


  const stablesCurrencyBalances: { [field in StablesField]?: TokenAmount } = {
    [StablesField.CURRENCY_1]: stableCcyAmounts?.filter(amount=>amount.token.address === stableCurrencies[StablesField.CURRENCY_1].address)[0],
    [StablesField.CURRENCY_2]: stableCcyAmounts?.filter(amount=>amount.token.address === stableCurrencies[StablesField.CURRENCY_2].address)[0],
    [StablesField.CURRENCY_3]: stableCcyAmounts?.filter(amount=>amount.token.address === stableCurrencies[StablesField.CURRENCY_3].address)[0],
    [StablesField.CURRENCY_4]: stableCcyAmounts?.filter(amount=>amount.token.address === stableCurrencies[StablesField.CURRENCY_4].address)[0],
  }



  const parsedStablesAmount1: TokenAmount | undefined = wrappedCurrencyAmount(
    tryParseAmount(chainId, typedValue1 === '' ? '0' : typedValue1, STABLES_INDEX_MAP[chainId][0]),
    chainId)

  const parsedStablesAmount2: TokenAmount | undefined = wrappedCurrencyAmount(
    tryParseAmount(chainId, typedValue2 === '' ? '0' : typedValue2, STABLES_INDEX_MAP[chainId][1]),
    chainId)

  const parsedStablesAmount3: TokenAmount | undefined = wrappedCurrencyAmount(
    tryParseAmount(chainId, typedValue3 === '' ? '0' : typedValue3, STABLES_INDEX_MAP[chainId][2]),
    chainId)

  const parsedStablesAmount4: TokenAmount | undefined = wrappedCurrencyAmount(
    tryParseAmount(chainId, typedValue4 === '' ? '0' : typedValue4, STABLES_INDEX_MAP[chainId][3]),
    chainId)

  /* Object.assign({},
    ...fieldList.map((_, index) => ({ [fieldList[index]]: tryParseAmount(chainId, typedValues[index], stableCurrencies[index]) }))); */

  // liquidity minted
  const stablesLiquidityMinted = useMemo(() => {

    if (stablePool && totalSupply) {
      return stablePool.getLiquidityAmount( // BigNumber.from(0)
        [
          parsedStablesAmount1 === undefined ? BigNumber.from(0) : parsedStablesAmount1.toBigNumber(),
          parsedStablesAmount2 === undefined ? BigNumber.from(0) : parsedStablesAmount2.toBigNumber(),
          parsedStablesAmount3 === undefined ? BigNumber.from(0) : parsedStablesAmount3.toBigNumber(),
          parsedStablesAmount4 === undefined ? BigNumber.from(0) : parsedStablesAmount4.toBigNumber()

        ],
        true)
    }
    return undefined
  }, [parsedStablesAmount1, parsedStablesAmount2, parsedStablesAmount3, parsedStablesAmount4, stablePool, totalSupply])

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

  if (!parsedStablesAmount1 && !parsedStablesAmount2
    && !parsedStablesAmount3 && !parsedStablesAmount4) {
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
    [StablesField.CURRENCY_1]: parsedStablesAmount1 === undefined ? new TokenAmount(STABLES_INDEX_MAP[chainId][0], '0') : parsedStablesAmount1,
    [StablesField.CURRENCY_2]: parsedStablesAmount2 === undefined ? new TokenAmount(STABLES_INDEX_MAP[chainId][1], '0') : parsedStablesAmount2,
    [StablesField.CURRENCY_3]: parsedStablesAmount3 === undefined ? new TokenAmount(STABLES_INDEX_MAP[chainId][2], '0') : parsedStablesAmount3,
    [StablesField.CURRENCY_4]: parsedStablesAmount4 === undefined ? new TokenAmount(STABLES_INDEX_MAP[chainId][3], '0') : parsedStablesAmount4
  }

  return {
    stableCurrencies,
    stablesCurrencyBalances,
    parsedStablesAmounts,
    stablesLiquidityMinted: !publicDataLoaded ? null : new TokenAmount(stablePool.liquidityToken, stablesLiquidityMinted === undefined ? ZERO : stablesLiquidityMinted.toBigInt()),
    stablesPoolTokenPercentage,
    stablesError,
  }
}