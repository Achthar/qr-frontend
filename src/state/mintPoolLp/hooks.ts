/* eslint object-shorthand: 0 */
import { parseUnits } from '@ethersproject/units'
import { Currency, TokenAmount, ZERO, StablePool, Percent, STABLES_INDEX_MAP, Token, WeightedPool } from '@requiemswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import useTotalSupply from 'hooks/useTotalSupply'
import { wrappedCurrency, wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount, tryParseTokenAmount } from '../swapV3/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { typeInput, typeInputs } from './actions'





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

export function useMintPoolState(): AppState['mintPoolLp'] {
  return useSelector<AppState, AppState['mintPoolLp']>((state) => state.mintPoolLp)
}


export function useMintPoolLpActionHandlers(): {
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


export function useDerivedMintPoolInfo(
  stablePool: WeightedPool,
  publicDataLoaded: boolean,
  userBalances: TokenAmount[],
  account?: string
): {
  orderedUserBalances: TokenAmount[],
  parsedInputAmounts: TokenAmount[]
  poolLiquidityMinted?: TokenAmount
  poolTokenPercentage?: Percent
  poolError?: string
} {

  const { values } = useMintPoolState()

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

  let poolError: string | undefined
  if (!account) {
    poolError = 'Connect Wallet'
  }

  const orderedStableCcyUserBalances: TokenAmount[] = stablesCurrencyBalances?.map(x => userBalances.find(y => y.token.equals(x.token)))

  let input = false
  for (let i = 0; i < parsedInputAmounts?.length; i++) {
    if (parsedInputAmounts && orderedStableCcyUserBalances?.[i]?.lessThan(parsedInputAmounts[i])) {
      poolError = `Insufficient ${orderedStableCcyUserBalances?.[i].token.symbol} balance`
    }
    if (parsedInputAmounts[i]?.raw.gt(ZERO)) { input = true }
  }

  if (!input)
    poolError = 'Enter an amount'

  return {
    orderedUserBalances: orderedStableCcyUserBalances,
    parsedInputAmounts: parsedInputAmounts,
    poolLiquidityMinted: !publicDataLoaded ? null : new TokenAmount(stablePool.liquidityToken, stablesLiquidityMinted === undefined ? ZERO : stablesLiquidityMinted.toBigInt()),
    poolTokenPercentage: stablesPoolTokenPercentage,
    poolError,
  }
}