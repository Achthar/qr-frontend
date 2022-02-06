import { createReducer } from '@reduxjs/toolkit'
import { WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { STABLES, REQT } from 'config/constants/tokens'
import {
  refreshBalances,
  reset,
  refreshNetworkCcyBalance,
  setBalanceLoadingState
} from './actions'
import { fetchUserNetworkCcyBalanceBalances } from './fetchUserNetworkCcyBalance'
import { fetchUserTokenBalances } from './fetchUserTokenBalances'

const initialChainId = 43113

export interface UserBalanceState {
  // we save all balance values as strings for each address
  readonly networkCcyBalance: string
  readonly balances: { [address: string]: string }
  readonly isLoadingTokens: boolean
  readonly isLoadingNetworkCcy: boolean
}

const initialState: UserBalanceState = {
  networkCcyBalance: '0',
  isLoadingTokens: true,
  isLoadingNetworkCcy: true,
  balances: Object.assign({},
    ...[
      ...[WRAPPED_NETWORK_TOKENS[initialChainId],
      REQT[initialChainId]],
      ...STABLES[initialChainId]
    ].map((x) => ({ [x.address]: '0' }))),
}

export default createReducer<UserBalanceState>(initialState, (builder) =>
  builder
    .addCase(reset, () => initialState
    )
    .addCase(refreshBalances, (state, { payload: { newBalances } }) => {

      return {
        ...state,
        balances: newBalances,
      }
    }
    )
    .addCase(fetchUserTokenBalances.fulfilled, (state, action) => {

      return {
        ...state,
        balances: action.payload,
        isLoadingTokens: false
      }
    }
    )
    .addCase(fetchUserTokenBalances.pending, (state, action) => {

      return {
        ...state,
        isLoadingTokens: true,
      }
    }
    )
    .addCase(fetchUserNetworkCcyBalanceBalances.fulfilled, (state, action) => {
      return {
        ...state,
        networkCcyBalance: action.payload.networkCcyBalance,
        isLoadingNetworkCcy: false
      }
    }
    )
    .addCase(fetchUserNetworkCcyBalanceBalances.pending, (state, action) => {

      return {
        ...state,
        isLoadingNetworkCcy: true,
      }
    }
    )
    .addCase(refreshNetworkCcyBalance, (state, { payload: { newBalance } }) => {

      return {
        ...state,
        networkCcyBalance: newBalance,
      }
    }
    ),
)
