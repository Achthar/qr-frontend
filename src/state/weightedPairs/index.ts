/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import isArchivedBondId from 'utils/bondHelpers'
import { bonds as bondList, bondList as bondsDict } from 'config/constants/bonds'
import { BondConfig } from 'config/constants/types'
import { stableSwapInitialData } from 'config/constants/stablePools';
import { getAllTokenPairs } from 'config/constants/tokenPairs';
import { bnParser, fetchWeightedPairMetaData } from './fetchWeightedPairMetaData';
import { StablePoolConfig, StablePoolsState, WeightedPairState } from '../types'
import { fetchPoolUserAllowancesAndBalances } from './fetchWeightedPairUserData';
import { changeChainIdWeighted } from './actions';
import { fetchWeightedPairData, fetchWeightedPairUserData } from './fetchWeightedPairData';


// import { chain } from 'lodash'


const chainIdFromState = 43113 // useAppSelector((state) => state.application.chainId)


function initialState(chainId: number): WeightedPairState {
  return {
    referenceChain: chainId,
    tokenPairs: getAllTokenPairs(chainId),
    weightedPairMeta: {},
    weightedPairs: {},
    metaDataLoaded: false,
    reservesAndWeightsLoaded: false,
    userBalancesLoaded: false
  }

}

export function nonArchivedBonds(chainId: number): BondConfig[] { return bondList(chainId).filter(({ bondId }) => !isArchivedBondId(bondId)) }

interface PoolUserDataResponse {
  index: number
  allowances: string[]
  lpAllowance: string
  lpBalance: string
  userWithdarawFee: string
}



export const fetchStablePoolUserDataAsync = createAsyncThunk<PoolUserDataResponse[], { chainId: number, account: string; pools: StablePoolConfig[] }>(
  'stablePools/fetchStablePoolsUserDataAsync',
  async ({ chainId, account, pools }) => {

    const {
      allowances,
      balances
    } = await fetchPoolUserAllowancesAndBalances(chainId, account, pools)




    return allowances.map((_, index) => {
      return {
        index,
        lpAllowance: allowances[index],
        lpBalance: balances[index],
        userWithdrawFee: '0',
        allowances: ['0', '0', '0', '0']
      }
    })
  },
)


export const stablePoolSlice = createSlice({
  name: 'weightedPairs',
  initialState: initialState(chainIdFromState), // TODO: make that more flexible
  reducers: {       // 0) chainmId change - new init
    // resetWeightedPairChainId: (state, action) => {
    //   console.log("WP SC", state, initialState(action.payload.newChainId), action.payload.newChainId)
    //   state = initialState(action.payload.newChainId);
    // }
  }
  ,
  extraReducers: (builder) => {
    // Update pairs with live data
    builder
      // 0) chainmId change - new init
      .addCase(changeChainIdWeighted, (state, action) => {
        state.metaDataLoaded = false
        state.referenceChain = action.payload.newChainId
        state.userBalancesLoaded = false
        state.tokenPairs = getAllTokenPairs(action.payload.newChainId)
        state.weightedPairMeta = {}
        state.weightedPairs = {}
      })
      // 1) fetch addresses for existing pairs
      .addCase(fetchWeightedPairMetaData.pending, state => {
        state.metaDataLoaded = false;
      })
      .addCase(fetchWeightedPairMetaData.fulfilled, (state, action) => {
        // add metadata to state
        state.weightedPairMeta = action.payload
        // initialize weighted pairs
        state.weightedPairs = {}
        state.metaDataLoaded = true;
      })
      .addCase(fetchWeightedPairMetaData.rejected, (state, { error }) => {
        state.metaDataLoaded = false;
        console.log(error, state)
        console.error(error.message);
      }).addCase(fetchWeightedPairData.pending, state => {
        state.reservesAndWeightsLoaded = false;
      })
      // 2) fetch reserves and weights for these pairs
      .addCase(fetchWeightedPairData.fulfilled, (state, action) => {
        // get keys for token pairs
        const keys = Object.keys(action.payload)
        for (let i = 0; i < keys.length; i++) {
          // get keys for weight-fee constellation
          const pairKeys = Object.keys(action.payload[keys[i]])
          for (let j = 0; j < pairKeys.length; j++) {
            // add the data
            if (!state.weightedPairs[keys[i]])
              state.weightedPairs[keys[i]] = {}

            state.weightedPairs[keys[i]][pairKeys[j]] = {
              ...state.weightedPairs[keys[i]][pairKeys[j]],
              ...action.payload[keys[i]][pairKeys[j]]
            };
          }
        }
        state.reservesAndWeightsLoaded = true;
      })
      .addCase(fetchWeightedPairData.rejected, (state, { error }) => {
        state.reservesAndWeightsLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // 3) fetch reserves and weights for these pairs
      .addCase(fetchWeightedPairUserData.fulfilled, (state, action) => {
        // get keys for token pairs
        console.log("WP USERD", action.payload)
        const keys = Object.keys(action.payload)
        for (let i = 0; i < keys.length; i++) {
          // get keys for weight-fee constellation
          const pairKeys = Object.keys(action.payload[keys[i]])
          for (let j = 0; j < pairKeys.length; j++) {
            // add the data
            if (!state.weightedPairs[keys[i]])
              state.weightedPairs[keys[i]] = {}

            if (state.weightedPairs[keys[i]][pairKeys[j]]) {
              state.weightedPairs[keys[i]][pairKeys[j]] = {
                ...state.weightedPairs[keys[i]][pairKeys[j]],
                ...action.payload[keys[i]][pairKeys[j]]
              };
            } else {
              state.weightedPairs[keys[i]][pairKeys[j]] = {
                ...action.payload[keys[i]][pairKeys[j]]
              };
            }
          }
        }
        state.userBalancesLoaded = true;
      })
      .addCase(fetchWeightedPairUserData.rejected, (state, { error }) => {
        state.userBalancesLoaded = false;
        console.log(error, state)
        console.error(error.message);
      })
    // // Update pools with user data
    // .addCase(fetchStablePoolUserDataAsync.fulfilled, (state, action) => {
    //   action.payload.forEach((userDataEl) => {
    //     state.pools[userDataEl.index] = { ...state.pools[userDataEl.index], userData: userDataEl }
    //   })
    //   state.userDataLoaded = true
    // }).addCase(changeChainId, (state, action) => {
    //   state = initialState(action.payload.newChainId)
    // })
  },
})

// export const {resetWeightedPairChainId} = stablePoolSlice.actions

export default stablePoolSlice.reducer


