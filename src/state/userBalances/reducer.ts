import { createReducer } from '@reduxjs/toolkit'
import { Currency, CurrencyAmount, TokenAmount, NETWORK_CCY, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { STABLES, REQT } from 'config/constants/tokens'
import {
  addMulticallListeners,
  errorFetchingMulticallResults,
  fetchingMulticallResults,
  removeMulticallListeners,
  toCallKey,
  updateMulticallResults, BalanceField, addToken, refreshBalances, reset, refreshNetworkCcyBalance, setBalanceLoadingState
} from './actions'

const initialChainId = 43113

export interface UserBalanceState {
  // we save all balance values as strings for each address
  readonly networkCcyBalance: string
  readonly balances: { [address: string]: string }
  readonly isLoading: boolean

  callListeners?: {
    // on a per-chain basis
    [chainId: number]: {
      // stores for each call key the listeners' preferences
      [callKey: string]: {
        // stores how many listeners there are per each blocks per fetch preference
        [blocksPerFetch: number]: number
      }
    }
  }

  callResults: {
    [chainId: number]: {
      [callKey: string]: {
        data?: string | null
        blockNumber?: number
        fetchingBlockNumber?: number
      }
    }
  }
}

const initialState: UserBalanceState = {
  networkCcyBalance: '0',
  isLoading: true,
  balances: Object.assign({}, ...[...[WRAPPED_NETWORK_TOKENS[initialChainId], REQT[initialChainId]], ...STABLES[initialChainId]].map((x) => ({ [x.address]: '0' }))),
  callResults: {},
}

export default createReducer<UserBalanceState>(initialState, (builder) =>
  builder
    .addCase(reset, () => initialState
    ).addCase(refreshBalances, (state, { payload: { newBalances } }) => {

      return {
        ...state,
        balances: newBalances,
      }
    }
    ).addCase(refreshNetworkCcyBalance, (state, { payload: { newBalance } }) => {

      return {
        ...state,
        networkCcyBalance: newBalance,
      }
    }
    ).addCase(setBalanceLoadingState, (state, { payload: { newIsLoading } }) => {

      return {
        ...state,
        isLoading: newIsLoading,
      }
    }
    ).addCase(addMulticallListeners, (state, { payload: { calls, chainId, options: { blocksPerFetch = 1 } = {} } }) => {
      const listeners: UserBalanceState['callListeners'] = state.callListeners
        ? state.callListeners
        : (state.callListeners = {})
      listeners[chainId] = listeners[chainId] ?? {}
      calls.forEach((call) => {
        const callKey = toCallKey(call)
        listeners[chainId][callKey] = listeners[chainId][callKey] ?? {}
        listeners[chainId][callKey][blocksPerFetch] = (listeners[chainId][callKey][blocksPerFetch] ?? 0) + 1
      })
    })
    .addCase(
      removeMulticallListeners,
      (state, { payload: { chainId, calls, options: { blocksPerFetch = 1 } = {} } }) => {
        const listeners: UserBalanceState['callListeners'] = state.callListeners
          ? state.callListeners
          : (state.callListeners = {})

        if (!listeners[chainId]) return
        calls.forEach((call) => {
          const callKey = toCallKey(call)
          if (!listeners[chainId][callKey]) return
          if (!listeners[chainId][callKey][blocksPerFetch]) return

          if (listeners[chainId][callKey][blocksPerFetch] === 1) {
            delete listeners[chainId][callKey][blocksPerFetch]
          } else {
            listeners[chainId][callKey][blocksPerFetch]--
          }
        })
      },
    )
    .addCase(fetchingMulticallResults, (state, { payload: { chainId, fetchingBlockNumber, calls } }) => {
      state.callResults[chainId] = state.callResults[chainId] ?? {}
      calls.forEach((call) => {
        const callKey = toCallKey(call)
        const current = state.callResults[chainId][callKey]
        if (!current) {
          state.callResults[chainId][callKey] = {
            fetchingBlockNumber,
          }
        } else {
          if ((current.fetchingBlockNumber ?? 0) >= fetchingBlockNumber) return
          state.callResults[chainId][callKey].fetchingBlockNumber = fetchingBlockNumber
        }
      })
    })
    .addCase(errorFetchingMulticallResults, (state, { payload: { fetchingBlockNumber, chainId, calls } }) => {
      state.callResults[chainId] = state.callResults[chainId] ?? {}
      calls.forEach((call) => {
        const callKey = toCallKey(call)
        const current = state.callResults[chainId][callKey]
        if (!current) return // only should be dispatched if we are already fetching
        if (current.fetchingBlockNumber === fetchingBlockNumber) {
          delete current.fetchingBlockNumber
          current.data = null
          current.blockNumber = fetchingBlockNumber
        }
      })
    })
    .addCase(updateMulticallResults, (state, { payload: { chainId, results, blockNumber } }) => {
      state.callResults[chainId] = state.callResults[chainId] ?? {}
      Object.keys(results).forEach((callKey) => {
        const current = state.callResults[chainId][callKey]
        if ((current?.blockNumber ?? 0) > blockNumber) return
        state.callResults[chainId][callKey] = {
          data: results[callKey],
          blockNumber,
        }
      })
    }),
)
