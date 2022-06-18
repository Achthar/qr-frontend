import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount, Token, TokenAmount, Swap, NETWORK_CCY, StablePool, AmplifiedWeightedPair, PoolDictionary } from '@requiemswap/sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useENS from 'hooks/ENS/useENS'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useCurrency } from 'hooks/Tokens'
import useUserAddedTokens from 'state/user/hooks/useUserAddedTokens'
import { BigNumber } from 'ethers'

import { BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED } from 'config/constants'
import { TokenPair } from 'config/constants/types'
import { serializeToken } from 'state/user/hooks/helpers'
import { wrappedCurrency, wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import { useGetWeightedPairsTradeState } from 'hooks/useGetWeightedPairsState'
import { useGetWeightedPoolState } from 'hooks/useGetWeightedPoolState'

import { useGeneratePairData, useGeneratePoolDict, useGetRoutes, useTradeV3ExactIn, useTradeV3ExactOut } from 'hooks/TradesV3'
import { useGetStablePoolState } from 'hooks/useGetStablePoolState'
import useRefresh from 'hooks/useRefresh'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useTranslation } from 'contexts/Localization'
import { isAddress } from 'utils'
import { computeSlippageAdjustedAmountsV3 } from 'utils/pricesV3'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { SwapV3State } from './reducer'
import { useUserSlippageTolerance } from '../user/hooks'

export function useSwapV3State(): AppState['swapV3'] {
  return useSelector<AppState, AppState['swapV3']>((state) => state.swapV3)
}

export function useSwapV3ActionHandlers(chainId: number): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency instanceof Token ? currency.address : currency === NETWORK_CCY[chainId] ? NETWORK_CCY[chainId].symbol : '',
        }),
      )
    },
    [chainId, dispatch],
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch],
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch],
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

// try to parse a user entered amount for a given token
export function tryParseTokenAmount(value: string, token: Token): TokenAmount | undefined {
  if (!value || !token) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, token.decimals).toString()
    if (typedValueParsed !== '0') {
      return new TokenAmount(token, BigNumber.from(typedValueParsed))
    }
  } catch (error: any) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

// try to parse a user entered amount for a given token
export function tryParseAmount(chainId: number, value?: string, currency?: Currency): CurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return currency instanceof Token
        ? new TokenAmount(currency, BigNumber.from(typedValueParsed))
        : CurrencyAmount.networkCCYAmount(chainId, BigNumber.from(typedValueParsed))
    }
  } catch (error: any) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

const BAD_RECIPIENT_ADDRESSES: string[] = [
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a', // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // v2 router 02
]

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(trade: Swap, checksummedAddress: string): boolean {
  return (
    trade.route.path.some((token) => token.address === checksummedAddress) ||
    trade.route.swapData.some((source) => source.poolRef === checksummedAddress)
  )
}

function containsToken(token: Token, list: Token[]) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].equals(token)) {
      return true;
    }
  }

  return false;
}

export function useAllTradeTokenPairs(tokenA: Token, tokenB: Token, chainId: number): TokenPair[] {
  const userAdded = useUserAddedTokens()
  const relevantTokens = useMemo(() => {

    return [...BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED[chainId], ...userAdded]
  },
    [chainId, userAdded]
  )

  const [aInBase, bInBase] = useMemo(() =>
    [
      tokenA ? containsToken(tokenA, relevantTokens) : false,
      tokenB ? containsToken(tokenB, relevantTokens) : false
    ],
    [tokenA, tokenB, relevantTokens])

  const expandedTokenList = useMemo(() => {
    if (!tokenA || !tokenB) {
      return relevantTokens
    }
    if (aInBase && !bInBase) {
      return [...[tokenA], ...[tokenB], ...relevantTokens]
    }
    if (!aInBase && !bInBase) {
      return [...[tokenA], ...[tokenB], ...relevantTokens]
    }
    if (!aInBase && bInBase) {
      return [...[tokenA], ...relevantTokens]
    }
    if (aInBase && bInBase) {
      return relevantTokens
    }
    return []
  },
    [tokenA, tokenB, aInBase, bInBase, relevantTokens])


  const basePairList: TokenPair[] = []
  for (let i = 0; i < expandedTokenList.length; i++) {
    for (let k = i + 1; k < expandedTokenList.length; k++) {
      basePairList.push(
        expandedTokenList[i].address.toLowerCase() < expandedTokenList[k].address.toLowerCase() ?
          {
            token0: serializeToken(expandedTokenList[i]),
            token1: serializeToken(expandedTokenList[k])
          } : {
            token0: serializeToken(expandedTokenList[k]),
            token1: serializeToken(expandedTokenList[i])
          }
      )
    }
  }
  return basePairList

}

// funtion to get all relevant weighted pairs
// requires two calls if ccys are not in base
// 1) check whether pair exists
// 2) fetch reserves
function useAllCommonWeightedPairsFromState(currencyA?: Currency, currencyB?: Currency): AmplifiedWeightedPair[] {
  const { chainId } = useNetworkState()
  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const tokenPairs = useAllTradeTokenPairs(tokenA, tokenB, chainId)
  const { slowRefresh } = useRefresh()
  const { pairs, metaDataLoaded, reservesAndWeightsLoaded } = useGetWeightedPairsTradeState(chainId, tokenPairs, slowRefresh)

  return useMemo(
    () => {
      return metaDataLoaded && reservesAndWeightsLoaded ? pairs : []
    },
    [metaDataLoaded, reservesAndWeightsLoaded, pairs]
  )

}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapV3Info(chainId: number, account: string, tokenBalances: { [address: string]: TokenAmount }, networkCcyBalance: CurrencyAmount): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmount: CurrencyAmount | undefined
  v3Trade: Swap | undefined
  poolDict: PoolDictionary
  inputError?: string
} {
  const { t } = useTranslation()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useSwapV3State()

  // we always will load stable pools as these are most commonly routed through
  // call pool from state
  const { slowRefresh } = useRefresh()


  const { stablePools, stableAmounts, userDataLoaded, publicDataLoaded } = useGetStablePoolState(chainId, account, slowRefresh, slowRefresh)

  const { weightedPools, userDataLoaded: weightedUserLoaded, publicDataLoaded: weightedPublicLoaded } = useGetWeightedPoolState(chainId, account, slowRefresh, slowRefresh)

  const inputCurrency = useCurrency(chainId, inputCurrencyId)
  const outputCurrency = useCurrency(chainId, outputCurrencyId)

  const recipientLookup = useENS(chainId, recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  // fetch balances from state if available
  const [inputCurrencyBalance, outputCurrencyBalance] = useMemo(() => {
    let _inputCurrencyBalance: CurrencyAmount
    let _outputCurrencyBalance: CurrencyAmount
    if (!inputCurrency) {
      _inputCurrencyBalance = undefined
    } else if (inputCurrency === NETWORK_CCY[chainId]) {
      _inputCurrencyBalance = networkCcyBalance
    } else {
      _inputCurrencyBalance = tokenBalances[(inputCurrency as Token).address]
    }

    if (!outputCurrency) {
      _outputCurrencyBalance = undefined
    } else if (outputCurrency === NETWORK_CCY[chainId]) {
      _outputCurrencyBalance = networkCcyBalance
    } else {
      _outputCurrencyBalance = tokenBalances[(outputCurrency as Token).address]
    }


    return [_inputCurrencyBalance, _outputCurrencyBalance]
  },
    [inputCurrency, outputCurrency, tokenBalances, networkCcyBalance, chainId]
  )

  // if balances are in state do not load them manually - if not fetch them here
  const relevantTokenBalances = useCurrencyBalances(chainId, account ?? undefined, [
    inputCurrencyBalance?.currency ? undefined : inputCurrency ?? undefined,
    outputCurrencyBalance?.currency ? undefined : outputCurrency ?? undefined,
  ])


  const [inputToken, outputToken] = useMemo(() => {
    return [
      wrappedCurrency(inputCurrency, chainId), wrappedCurrency(outputCurrency, chainId)]
  }, [inputCurrency, outputCurrency, chainId]
  )


  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = wrappedCurrencyAmount(tryParseAmount(chainId, typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined), chainId)


  const relevatPairs = useAllCommonWeightedPairsFromState(inputCurrency, outputCurrency)

  const pairData = useGeneratePairData(relevatPairs, stablePools, weightedPools)
  const poolDict = useGeneratePoolDict(relevatPairs, stablePools, weightedPools)
  const routes = useGetRoutes(pairData, wrappedCurrency(inputCurrency, chainId), wrappedCurrency(outputCurrency, chainId))

  const bestTradeExactIn = useTradeV3ExactIn(publicDataLoaded, routes, poolDict, isExactIn ? parsedAmount : undefined, outputToken ?? undefined)
  const bestTradeExactOut = useTradeV3ExactOut(publicDataLoaded, routes, poolDict, inputToken ?? undefined, !isExactIn ? parsedAmount : undefined)


  const v3Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  // assign the user balances
  const currencyBalances = {
    [Field.INPUT]: inputCurrencyBalance ?? relevantTokenBalances[0],
    [Field.OUTPUT]: outputCurrencyBalance ?? relevantTokenBalances[1],
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  }

  let inputError: string | undefined
  if (!account) {
    inputError = t('Connect Wallet')
  }

  if (!parsedAmount) {
    inputError = inputError ?? t('Enter an amount')
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t('Select a token')
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? t('Enter a recipient')
  } else if (
    BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1 ||
    (bestTradeExactIn && involvesAddress(bestTradeExactIn, formattedTo)) ||
    (bestTradeExactOut && involvesAddress(bestTradeExactOut, formattedTo))
  ) {
    inputError = inputError ?? t('Invalid recipient')
  }

  const [allowedSlippage] = useUserSlippageTolerance()

  const slippageAdjustedAmounts = v3Trade && allowedSlippage && computeSlippageAdjustedAmountsV3(v3Trade, allowedSlippage)

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    slippageAdjustedAmounts ? slippageAdjustedAmounts[Field.INPUT] : null,
  ]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = t('Insufficient %symbol% balance', { symbol: amountIn.currency.symbol })
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    v3Trade: v3Trade ?? undefined,
    poolDict,
    inputError,
  }
}


function parseCurrencyFromURLParameter(chainId: number, urlParam: any): string {

  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toUpperCase() === NETWORK_CCY[chainId].symbol) return NETWORK_CCY[chainId].symbol
    if (valid === false) return NETWORK_CCY[chainId].symbol
  }
  return NETWORK_CCY[chainId].symbol ?? ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  // eslint-disable-next-line no-restricted-globals
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSwapV3State(chainId: number, parsedQs: ParsedQs): SwapV3State {
  let inputCurrency = parseCurrencyFromURLParameter(chainId, parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(chainId, parsedQs.outputCurrency)
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = ''
    } else {
      outputCurrency = ''
    }
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch(chainId: number):
  | { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined }
  | undefined {
  const dispatch = useDispatch<AppDispatch>()
  const parsedQs = useParsedQueryString()
  const [result, setResult] = useState<
    { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined } | undefined
  >()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToSwapV3State(chainId, parsedQs)

    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: null,
      }),
    )

    setResult({ inputCurrencyId: parsed[Field.INPUT].currencyId, outputCurrencyId: parsed[Field.OUTPUT].currencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}
