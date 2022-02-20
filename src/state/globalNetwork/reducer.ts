import { createReducer } from '@reduxjs/toolkit'
import { setChainId, setAccount } from './actions'

export interface GlobalNetworkState {
  readonly chainId: number,
  readonly account: string
}

const initialState: GlobalNetworkState = {
  chainId: 43113,
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
