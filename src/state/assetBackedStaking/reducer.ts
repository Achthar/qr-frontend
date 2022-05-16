import { createReducer } from '@reduxjs/toolkit'
import { SerializedBigNumber } from 'state/types'
import { typeInput, typeInputTime } from './actions'
import { fetchStakingUserData } from './fetchStakingUserData'
import { fetchStakingData } from './fetchStakingData'
import { fetchTokenData } from './fetchTokenData'

export interface StakeData {
  index: SerializedBigNumber
  secondsToNextEpoch: number
}

export interface StakedRequiem {
  INDEX: SerializedBigNumber
  totalSupplySReq: SerializedBigNumber
  totalSupplyGReq: SerializedBigNumber
  totalSupplyAbReq: SerializedBigNumber
  stakingBalanceGreq: SerializedBigNumber
  stakingBalanceSreq: SerializedBigNumber
  gonsPerFragment: SerializedBigNumber
}

export interface Epoch {
  length: number
  number: number
  end: number
  distribute: SerializedBigNumber
}

export interface Claim {
  deposit: SerializedBigNumber; // if forfeiting
  gons: SerializedBigNumber; // staked balance
  expiry: number; // end of warmup period
  lock: boolean; // prevents malicious delays for claim
}


export interface UserData {
    warmupInfo: Claim,
    sReqBalance: SerializedBigNumber,
    gReqBalance: SerializedBigNumber
}


export interface AssetBackedStakingState {
  referenceChainId: number,
  staking: {
    [chainId: number]: {
      implemented: boolean,
      stakeData: StakeData,
      stakedRequiem: StakedRequiem,
      stakedReqLoaded: boolean,
      epoch: Epoch
      userData: UserData
      userDataLoaded: boolean
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
      stakedRequiem: {
        INDEX: '1',
        totalSupplySReq: '0',
        totalSupplyAbReq: '0',
        totalSupplyGReq: '0',
        stakingBalanceGreq: '0',
        stakingBalanceSreq: '0',
        gonsPerFragment: '0',
      },
      epoch: {
        length: 99999999999999,
        number: 0,
        end: 999999999999999999,
        distribute: '0'
      },
      userData: {
          warmupInfo: { deposit: '0', gons: '0', expiry: 0, lock: false },
          sReqBalance: '0',
          gReqBalance: '0'
      },
      userDataLoaded: false,
      stakedReqLoaded: false,
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

    }).addCase(fetchStakingUserData.pending, state => {
      state.staking[state.referenceChainId].userDataLoaded = false;
    })
    .addCase(fetchStakingUserData.fulfilled, (state, action) => {
      state.staking[state.referenceChainId].userDataLoaded = true;
      state.staking[state.referenceChainId].userData = action.payload
    })
    .addCase(fetchStakingUserData.rejected, (state, { error }) => {
      state.staking[state.referenceChainId].userDataLoaded = true;
      console.log(error, state)
      console.error(error.message);
    }).addCase(fetchTokenData.pending, state => {
      state.staking[state.referenceChainId].stakedReqLoaded = false;
    })
    .addCase(fetchTokenData.fulfilled, (state, action) => {
      state.staking[state.referenceChainId].stakedReqLoaded = true;
      state.staking[state.referenceChainId].stakedRequiem = action.payload
    })
    .addCase(fetchTokenData.rejected, (state, { error }) => {
      state.staking[state.referenceChainId].stakedReqLoaded = true;
      console.log(error, state)
      console.error(error.message);
    })
)
