import { createAction } from '@reduxjs/toolkit'
import { Token, CurrencyAmount, TokenAmount } from '@requiemswap/sdk'

export enum BalanceField {
  STABLES = 'STABLES',
  MAIN = 'MAIN',
  WEIGHTED_PAIRS = 'WEIGHTED_PAIRS',
  STABLE_LP = 'STABLE_LP',
  CUSTOM_TOKENS = 'CUSTOM_TOKENS',
  CUSTOM_LP = 'CUSTOM_LP'
}


export const addToken = createAction<{ token: Token; slot: BalanceField }>('userBalances/addToken')
export const refreshBalances = createAction<{ newBalances:{[address:string]:string} }>('userBalances/refreshBalances')
export const refreshNetworkCcyBalance = createAction<{ newBalance:string }>('userBalances/refreshNetworkCcyBalance')
export const setBalanceLoadingState = createAction<{ newIsLoading:boolean }>('userBalances/setBalanceLoadingState')
// export const refreshBalances = createAction<{ chainId: number, account: string, slot: BalanceField }>('userBalances/refreshBalances')
export const reset = createAction<void>('userBalances/reset')


export interface Call {
  address: string
  callData: string
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const LOWER_HEX_REGEX = /^0x[a-f0-9]*$/
export function toCallKey(call: Call): string {
  if (!ADDRESS_REGEX.test(call.address)) {
    throw new Error(`Invalid address: ${call.address}`)
  }
  if (!LOWER_HEX_REGEX.test(call.callData)) {
    throw new Error(`Invalid hex: ${call.callData}`)
  }
  return `${call.address}-${call.callData}`
}

export function parseCallKey(callKey: string): Call {
  const pcs = callKey.split('-')
  if (pcs.length !== 2) {
    throw new Error(`Invalid call key: ${callKey}`)
  }
  return {
    address: pcs[0],
    callData: pcs[1],
  }
}

export interface ListenerOptions {
  // how often this data should be fetched, by default 1
  readonly blocksPerFetch?: number
}

export const addMulticallListeners = createAction<{ chainId: number; calls: Call[]; options?: ListenerOptions }>(
  'userBalances/addMulticallListeners',
)
export const removeMulticallListeners = createAction<{ chainId: number; calls: Call[]; options?: ListenerOptions }>(
  'userBalances/removeMulticallListeners',
)
export const fetchingMulticallResults = createAction<{ chainId: number; calls: Call[]; fetchingBlockNumber: number }>(
  'userBalances/fetchingMulticallResults',
)
export const errorFetchingMulticallResults = createAction<{
  chainId: number
  calls: Call[]
  fetchingBlockNumber: number
}>('userBalances/errorFetchingMulticallResults')
export const updateMulticallResults = createAction<{
  chainId: number
  blockNumber: number
  results: {
    [callKey: string]: string | null
  }
}>('userBalances/updateMulticallResults')
