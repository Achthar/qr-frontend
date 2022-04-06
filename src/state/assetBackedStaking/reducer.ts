import { createReducer } from '@reduxjs/toolkit'
import { SerializedBigNumber } from 'state/types'
import { typeInput, typeInputTime } from './actions'
import { fetchStakingData } from './fetchStakingData'

export interface StakeData {
  index: SerializedBigNumber
  secondsToNextEpoch: number
}

export interface Epoch {
  length: number
  number: number
  end: number
  distribute: SerializedBigNumber
}

export interface UserData {
  data: string
}



export interface AssetBackedStakingState {
  referenceChainId: number,
  staking: {
    [chainId: number]: {
      implemented: boolean,
      stakeData: StakeData,
      epoch: Epoch
      userData: UserData
      dataLoaded: boolean
    }
  }
}

const initialState: AssetBackedStakingState = {
  referenceChainId: 43113,
  staking: {
    43113: {
      implemented: true,
      stakeData: {
        index: '1000000000000000000',
        secondsToNextEpoch: 99999999999
      },
      epoch: {
        length: 99999999999999,
        number: 0,
        end: 999999999999999999,
        distribute: '0'
      },
      userData: { data: '0' },
      dataLoaded: false
    }
  }
}

export default createReducer<AssetBackedStakingState>(initialState, (builder) =>
  builder
    .addCase(fetchStakingData.pending, state => {
      state.staking[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchStakingData.fulfilled, (state, action) => {
      state.staking[state.referenceChainId] = { dataLoaded: true, ...action.payload }
    })
    .addCase(fetchStakingData.rejected, (state, { error }) => {
      state.staking[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
)
