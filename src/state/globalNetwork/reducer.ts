import { createReducer } from '@reduxjs/toolkit'
import { FALLBACK_CHAINID } from 'config/constants'
import { setChainId, setAccount } from './actions'

export interface GlobalNetworkState {
  readonly chainId: number,
  readonly account: string
}

const initialChainId = Number(process?.env?.REACT_APP_DEFAULT_CHAIN_ID ?? FALLBACK_CHAINID)

const initialState: GlobalNetworkState = {
  chainId: initialChainId,
  account: undefined
}


export default createReducer<GlobalNetworkState>(initialState, (builder) =>
  builder
    .addCase(setChainId, (state, { payload: { chainId } }) => {
      state.chainId = chainId
    }).addCase(setAccount, (state, { payload: { account } }) => {
      return {
        ...state,
        account,
      }
    }),
)
