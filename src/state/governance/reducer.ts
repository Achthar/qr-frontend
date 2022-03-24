import { createReducer } from '@reduxjs/toolkit'
import { SerializedBigNumber } from 'state/types'
import { typeInput, typeInputTime } from './actions'
import { fetchGovernanceData } from './fetchGovernanceData'

export interface Lock {
  amount: SerializedBigNumber
  end: number
  minted: SerializedBigNumber
  multiplier: SerializedBigNumber
}


export interface GovernanceState {
  referenceChainId: number,
  data: {
    [chainId: number]: {
      dataLoaded: boolean
      balance: string
      staked: string
      locks: { [end: number]: Lock }
    }
  }
}

const initialState: GovernanceState = {
  referenceChainId: 43113,
  data: {
    43113: {
      dataLoaded: false,
      balance: '0',
      staked: '0',
      locks: {}
    }
  }
}

export default createReducer<GovernanceState>(initialState, (builder) =>
  builder
    .addCase(fetchGovernanceData.pending, state => {
      state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchGovernanceData.fulfilled, (state, action) => {
      state.data[state.referenceChainId] = { dataLoaded: true, ...action.payload }
    })
    .addCase(fetchGovernanceData.rejected, (state, { error }) => {
      state.data[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
)
