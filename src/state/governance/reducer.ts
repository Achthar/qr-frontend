import { createReducer } from '@reduxjs/toolkit'
import { typeInput, typeInputTime } from './actions'
import { fetchGovernanceDetails } from './fetchGovernanceDetails'

export interface GovernanceState {
  referenceChainId: number,
  data: {
    [chainId: number]: {
      dataLoaded: boolean
      balance: string
      staked: string
      lock: {
        amount: string
        end: number
      }
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
      lock: {
        amount: '0',
        end: 0
      }
    }
  }
}

export default createReducer<GovernanceState>(initialState, (builder) =>
  builder
    .addCase(fetchGovernanceDetails.pending, state => {
      state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchGovernanceDetails.fulfilled, (state, action) => {
      state.data[state.referenceChainId] = {dataLoaded:true, ...action.payload }
    })
    .addCase(fetchGovernanceDetails.rejected, (state, { error }) => {
      state.data[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
)
