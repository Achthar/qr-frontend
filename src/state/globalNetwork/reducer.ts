import { createReducer } from '@reduxjs/toolkit'
import { setChainId } from './actions'

export interface GlobalNetworkState {
  readonly chainId: number
}

const initialState: GlobalNetworkState = {
  chainId: 43113
}


export default createReducer<GlobalNetworkState>(initialState, (builder) =>
  builder
    .addCase(setChainId, (state, { payload: { chainId } }) => {
      return {
        ...state,
        chainId,
      }
    }),
)
