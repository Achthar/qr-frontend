import { Currency, CurrencyAmount, WRAPPED_NETWORK_TOKENS, JSBI, NETWORK_CCY, TokenAmount, Token, STABLECOINS } from '@requiemswap/sdk'
import { useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ERC20_INTERFACE from 'config/abi/erc20'
import { getAddress } from '@ethersproject/address'
import { REQT } from 'config/constants/tokens'
import { Interface, FunctionFragment } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useBlock } from 'state/block/hooks'
import { useWeb3React } from '@web3-react/core'

import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { addresses as contractAddresses } from 'config/constants/contracts'
import {
  addMulticallListeners,
  Call,
  removeMulticallListeners,
  parseCallKey,
  toCallKey,
  ListenerOptions,
  BalanceField,
  addToken,
  refreshNetworkCcyBalance,
  refreshBalances,
  reset
} from './actions'
import { AppDispatch, AppState } from '../index'

import multiCallAbi from '../../config/abi/Multicall.json'





const ZERO = JSBI.BigInt(0)

export function useUserBalancesState(): AppState['userBalances'] {
  return useSelector<AppState, AppState['userBalances']>((state) => state.userBalances)
}

// export function useUserBalancesActionHandlers(): {
//   onAddToken: (token: Token, slot: BalanceField) => void
//   onRefreshAllBalances: (networkCcyBalance: CurrencyAmount, mainBalances: TokenAmount[], stableBalances: TokenAmount[]) => void
// } {
//   const dispatch = useDispatch<AppDispatch>()

//   const onAddToken = useCallback(
//     (token: Token, slot: BalanceField) => {
//       dispatch(addToken({ token, slot }))
//     },
//     [dispatch],
//   )
//   const onRefreshAllBalances = useCallback(
//     (networkCcyBalance: CurrencyAmount, mainBalances: TokenAmount[], stableBalances: TokenAmount[]) => {
//       dispatch(refreshAllBalances({ networkCcyBalance, mainBalances, stableBalances }))
//     },
//     [dispatch]
//   )

//   return {
//     onAddToken,
//     onRefreshAllBalances
//   }
// }

export function getMainTokens(chainId: number): Token[] {
  return [WRAPPED_NETWORK_TOKENS[chainId], REQT[chainId]]
}

export function getStables(chainId: number): Token[] {
  return STABLECOINS[chainId]
}

export function getTokenAmounts(chainId: number, balances: { [address: string]: string }) {
  return [...[WRAPPED_NETWORK_TOKENS[chainId], REQT[chainId]], ...STABLECOINS[chainId]].map(token => new TokenAmount(token, balances[token.address] ?? '0'))

}
/**
 * Returns a map of the given addresses to their eventually consistent Network CCy balances.
 */
export function useNetworkCCYBalances(
  chainId: number,
  uncheckedAddresses?: (string | undefined)[],
): {
  [address: string]: string | undefined
} {
  const multicallContract = useMulticallContractViaChainId(chainId)
  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
          .map(isAddress)
          .filter((a): a is string => a !== false)
          .sort()
        : [],
    [uncheckedAddresses],
  )

  const results = useSingleContractMultipleData(
    chainId,
    multicallContract,
    'getEthBalance',
    addresses.map((address) => [address]),
  )

  return useMemo(
    () =>
      addresses.reduce<{ [address: string]: string }>((memo, address, i) => {
        const value = results?.[i]?.result?.[0]
        if (value) memo[address] = value.toString()
        return memo
      }, {}),
    [addresses, results],
  )
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[],
): [{ [tokenAddress: string]: string | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens],
  )
  console.log("useTokenBalancesWithLoadingIndicator Balances")
  const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens])

  const balances = useMultipleContractSingleData(tokens?.[0].chainId ?? 41331, validatedTokenAddresses, ERC20_INTERFACE, 'balanceOf', [
    address,
  ])

  const anyLoading: boolean = useMemo(() => balances.some((callState) => callState.loading), [balances])
  // console.log(tokens, "b", balances, anyLoading)
  return [
    useMemo(
      () =>
        address && validatedTokens.length > 0
          ? validatedTokens.reduce<{ [tokenAddress: string]: string | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result?.[0]
            const amount = value ? value.toString() : undefined
            if (amount) {
              memo[token.address] = amount
            }
            return memo
          }, {})
          : {},
      [address, validatedTokens, balances],
    ),
    anyLoading,
  ]
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[],
): { [tokenAddress: string]: string | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): string | undefined {
  const tokenBalances = useTokenBalances(account, [token])
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(
  chainId: number,
  account?: string,
  currencies?: (Currency | undefined)[],
): (string | undefined)[] {
  const tokens = useMemo(
    () => currencies?.filter((currency): currency is Token => currency instanceof Token) ?? [],
    [currencies],
  )

  const tokenBalances = useTokenBalances(account, tokens)

  const containsNetworkCcy: boolean = useMemo(() => currencies?.some((currency) => currency === NETWORK_CCY[chainId]) ?? false, [chainId, currencies])

  const ethBalance = useNetworkCCYBalances(chainId, containsNetworkCcy ? [account] : [])

  return useMemo(
    () =>
      currencies?.map((currency) => {
        if (!account || !currency) return undefined
        if (currency instanceof Token) return tokenBalances[currency.address]
        if (currency === NETWORK_CCY[chainId]) return ethBalance[account]
        return undefined
      }) ?? [],
    [chainId, account, currencies, ethBalance, tokenBalances],
  )
}

export function useCurrencyBalance(chainId: number, account?: string, currency?: Currency): string | undefined {
  return useCurrencyBalances(chainId, account, [currency])[0]
}


export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

type MethodArg = string | number | BigNumber
type MethodArgs = Array<MethodArg | MethodArg[]>

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

function isMethodArg(x: unknown): x is MethodArg {
  return ['string', 'number'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every((xi) => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}

interface CallResult {
  readonly valid: boolean
  readonly data: string | undefined
  readonly blockNumber: number | undefined
}

const INVALID_RESULT: CallResult = { valid: false, blockNumber: undefined, data: undefined }

// use this options object
export const NEVER_RELOAD: ListenerOptions = {
  blocksPerFetch: Infinity,
}

// the lowest level call for subscribing to contract data
function useCallsData(chainId: number, calls: (Call | undefined)[], options?: ListenerOptions): CallResult[] {
  const callResults = useSelector<AppState, AppState['userBalances']['callResults']>(
    (state) => state.multicall.callResults,
  )
  const dispatch = useDispatch<AppDispatch>()

  const serializedCallKeys: string = useMemo(
    () =>
      JSON.stringify(
        calls
          ?.filter((c): c is Call => Boolean(c))
          ?.map(toCallKey)
          ?.sort() ?? [],
      ),
    [calls],
  )
  // update listeners when there is an actual change that persists for at least 100ms
  useEffect(() => {
    const callKeys: string[] = JSON.parse(serializedCallKeys)
    if (!chainId || callKeys.length === 0) return undefined
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const calls = callKeys.map((key) => parseCallKey(key))
    dispatch(
      addMulticallListeners({
        chainId,
        calls,
        options,
      }),
    )

    return () => {
      dispatch(
        removeMulticallListeners({
          chainId,
          calls,
          options,
        }),
      )
    }
  }, [chainId, dispatch, options, serializedCallKeys])

  return useMemo(
    () =>
      calls.map<CallResult>((call) => {
        if (!chainId || !call) return INVALID_RESULT

        const result = callResults[chainId]?.[toCallKey(call)]
        let data
        if (result?.data && result?.data !== '0x') {
          // eslint-disable-next-line prefer-destructuring
          data = result.data

        }

        return { valid: true, data, blockNumber: result?.blockNumber }
      }),
    [callResults, calls, chainId],
  )
}

interface CallState {
  readonly valid: boolean
  // the result, or undefined if loading or errored/no data
  readonly result: Result | undefined
  // true if the result has never been fetched
  readonly loading: boolean
  // true if the result is not for the latest block
  readonly syncing: boolean
  // true if the call was made and is synced, but the return data is invalid
  readonly error: boolean
}

const INVALID_CALL_STATE: CallState = { valid: false, result: undefined, loading: false, syncing: false, error: false }
const LOADING_CALL_STATE: CallState = { valid: true, result: undefined, loading: true, syncing: true, error: false }

function toCallState(
  callResult: CallResult | undefined,
  contractInterface: Interface | undefined,
  fragment: FunctionFragment | undefined,
  latestBlockNumber: number | undefined,
): CallState {
  if (!callResult) return INVALID_CALL_STATE
  const { valid, data, blockNumber } = callResult
  if (!valid) return INVALID_CALL_STATE
  if (valid && !blockNumber) return LOADING_CALL_STATE
  if (!contractInterface || !fragment || !latestBlockNumber) return LOADING_CALL_STATE
  const success = data && data.length > 2
  const syncing = (blockNumber ?? 0) < latestBlockNumber
  let result: Result | undefined
  if (success && data) {
    try {
      result = contractInterface.decodeFunctionResult(fragment, data)
    } catch (error: any) {
      console.debug('Result data parsing failed', fragment, data)
      return {
        valid: true,
        loading: false,
        error: true,
        syncing,
        result,
      }
    }
  }
  return {
    valid: true,
    loading: false,
    syncing,
    result,
    error: !success,
  }
}

export function useSingleContractMultipleData(
  cahinId: number,
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[],
  options?: ListenerOptions,
): CallState[] {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])
  const calls = useMemo(
    () =>
      contract && fragment && callInputs && callInputs.length > 0
        ? callInputs.map<Call>((inputs) => {
          return {
            address: contract.address,
            callData: contract.interface.encodeFunctionData(fragment, inputs),
          }
        })
        : [],
    [callInputs, contract, fragment],
  )

  const results = useCallsData(cahinId, calls, options)

  const { currentBlock } = useBlock()

  return useMemo(() => {
    return results.map((result) => toCallState(result, contract?.interface, fragment, currentBlock))
  }, [fragment, contract, results, currentBlock])
}

export function useMultipleContractSingleData(
  chainId: number,
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options?: ListenerOptions,
): CallState[] {
  const fragment = useMemo(() => contractInterface.getFunction(methodName), [contractInterface, methodName])
  const callData: string | undefined = useMemo(
    () =>
      fragment && isValidMethodArgs(callInputs)
        ? contractInterface.encodeFunctionData(fragment, callInputs)
        : undefined,
    [callInputs, contractInterface, fragment],
  )

  const calls = useMemo(
    () =>
      fragment && addresses && addresses.length > 0 && callData
        ? addresses.map<Call | undefined>((address) => {
          return address && callData
            ? {
              address,
              callData,
            }
            : undefined
        })
        : [],
    [addresses, callData, fragment],
  )

  const results = useCallsData(chainId, calls, options)

  const { currentBlock } = useBlock()

  return useMemo(() => {
    return results.map((result) => toCallState(result, contractInterface, fragment, currentBlock))
  }, [fragment, results, contractInterface, currentBlock])
}

export function useSingleCallResult(
  chainId: number,
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options?: ListenerOptions,
): CallState {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])
  const calls = useMemo<Call[]>(() => {
    return contract && fragment && isValidMethodArgs(inputs)
      ? [
        {
          address: contract.address,
          callData: contract.interface.encodeFunctionData(fragment, inputs),
        },
      ]
      : []
  }, [contract, fragment, inputs])

  const result = useCallsData(chainId, calls, options)[0]
  const { currentBlock } = useBlock()

  return useMemo(() => {
    return toCallState(result, contract?.interface, fragment, currentBlock)
  }, [result, contract, fragment, currentBlock])
}

export function useSingleContractMultipleFunctions(
  chainId: number,
  contract: Contract | null | undefined,
  methodNames: string[],
  callInputs: OptionalMethodInputs[],
  options?: ListenerOptions,
): CallState[] {
  const fragments = useMemo(() => methodNames.map((methodName) => contract?.interface?.getFunction(methodName)), [contract, methodNames])
  const calls = useMemo(
    () =>
      contract && fragments && callInputs && callInputs.length > 0
        ? callInputs.map<Call>((inputs, index) => {
          return {
            address: contract.address,
            callData: contract.interface.encodeFunctionData(fragments[index], inputs),
          }
        })
        : [],
    [callInputs, contract, fragments],
  )

  const results = useCallsData(chainId, calls, options)

  const { currentBlock } = useBlock()

  return useMemo(() => {
    return results.map((result, index) => toCallState(result, contract?.interface, fragments[index], currentBlock))
  }, [fragments, contract, results, currentBlock])
}

export function useMulticallContractViaChainId(chainId: number): Contract | null {
  console.log("useMulticallContract")
  return useContract(contractAddresses.multiCall[chainId], multiCallAbi, false)
}

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error: any) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}



// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}


// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}
// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}