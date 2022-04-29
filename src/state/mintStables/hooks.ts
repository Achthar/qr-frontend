/* eslint object-shorthand: 0 */
import { parseUnits } from '@ethersproject/units'
import { Currency, TokenAmount, ZERO, StablePool, Percent, STABLES_INDEX_MAP, Token } from '@requiemswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import useTotalSupply from 'hooks/useTotalSupply'
import { wrappedCurrency, wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount, tryParseTokenAmount } from '../swapV3/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { StablesField, typeInput, typeInput1, typeInput2, typeInput3, typeInput4, typeInputs } from './actions'





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


export function useMintStablePoolActionHandlers(): {
  onFieldInput: (typedValue: string, fieldIndex: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldInput = useCallback(
    (typedValue: string, fieldIndex: number) => {
      dispatch(typeInput({
        typedValue, fieldIndex
      }))
    },
    [dispatch],
  )
  return { onFieldInput }
}


export function useDerivedMintStablesInfo(
  stablePool: StablePool,
  publicDataLoaded: boolean,
  stableCcyUserBalances: TokenAmount[],
  account?: string
): {
  orderedStableCcyUserBalances: TokenAmount[],
  parsedStablesAmounts: TokenAmount[]
  stablesLiquidityMinted?: TokenAmount
  stablesPoolTokenPercentage?: Percent
  stablesError?: string
} {

  const { values } = useMintStablesState()

  const chainId = stablePool?.chainId ?? 43113

  const totalSupply = !publicDataLoaded ? BigNumber.from(0) : stablePool.lpTotalSupply //   useTotalSupply(stablePool?.liquidityToken)


  const stablesCurrencyBalances: TokenAmount[] = stablePool?.getTokenAmounts()

  const parsedInputAmounts = useMemo(() => {
    return stablePool?.tokens?.map((ta, i) => new TokenAmount(ta, tryParseAmount(chainId, values[i] ?? '0', ta)?.raw ?? '0'))
  }, [stablePool, values, chainId])


  // liquidity minted
  const stablesLiquidityMinted = useMemo(() => {

    if (stablePool && totalSupply) {
      return stablePool.getLiquidityAmount( // BigNumber.from(0)
        parsedInputAmounts.map(pa => pa?.raw ?? ZERO),
        true)
    }
    return undefined
  }, [parsedInputAmounts, stablePool, totalSupply])

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

  const orderedStableCcyUserBalances: TokenAmount[] = stablesCurrencyBalances?.map(x => stableCcyUserBalances.find(y => y.token.equals(x.token)))

  let input = false
  for (let i = 0; i < parsedInputAmounts?.length; i++) {
    if (parsedInputAmounts && orderedStableCcyUserBalances?.[i]?.lessThan(parsedInputAmounts[i])) {
      stablesError = `Insufficient ${orderedStableCcyUserBalances?.[i].token.symbol} balance`
    }
    if (parsedInputAmounts[i]?.raw.gt(ZERO)) { input = true }
  }

  if (!input)
    stablesError = stablesError ?? 'Enter an amount'

  return {
    orderedStableCcyUserBalances,
    parsedStablesAmounts: parsedInputAmounts,
    stablesLiquidityMinted: !publicDataLoaded ? null : new TokenAmount(stablePool.liquidityToken, stablesLiquidityMinted === undefined ? ZERO : stablesLiquidityMinted.toBigInt()),
    stablesPoolTokenPercentage,
    stablesError,
  }
}