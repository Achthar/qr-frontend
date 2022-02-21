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
import { changeChainIdWeighted, metaDataChange, triggerRefreshUserData } from './actions';
import { fetchWeightedPairData, fetchWeightedPairReserves, fetchWeightedPairUserData } from './fetchWeightedPairData';


// import { chain } from 'lodash'


const chainIdFromState = 43113 // useAppSelector((state) => state.application.chainId)


function initialState(chainId: number) {
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
  initialState: {
    currentChain: 43113,
    43113: initialState(43113),
    42261: initialState(42261)
  }, // TODO: make that more flexible
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
        const newChainId = action.payload.newChainId
        state.currentChain = newChainId
        state[newChainId].metaDataLoaded = false
        state[newChainId].referenceChain = action.payload.newChainId
        state[newChainId].userBalancesLoaded = false
        state[newChainId].tokenPairs = getAllTokenPairs(action.payload.newChainId)
        state[newChainId].weightedPairMeta = {}
        state[newChainId].weightedPairs = {}
      }) // 0.1 metaData has changed (i.e. token pairs etc) and should be refreshed
      .addCase(metaDataChange, (state, action) => {
        state.currentChain = action.payload.chainId
        state[action.payload.chainId].metaDataLoaded = false
      }) // 0.1 metaData has changed (i.e. token pairs etc) and should be refreshed
      .addCase(triggerRefreshUserData, (state, action) => {
        state.currentChain = action.payload.chainId
        state[action.payload.chainId].userBalancesLoaded = false
      })
      // 1) fetch addresses for existing pairs
      .addCase(fetchWeightedPairMetaData.pending, (state, action) => {
        state[action.meta.arg.chainId].metaDataLoaded = false;
      })
      .addCase(fetchWeightedPairMetaData.fulfilled, (state, action) => {
        const chainId = action.meta.arg.chainId
        // add metadata to state
        state[chainId].weightedPairMeta = { ...state[chainId].weightedPairMeta, ...action.payload.metaData }
        state[chainId].tokenPairs = action.payload.currentPairs
        // initialize weighted pairs
        state[chainId].weightedPairs = {}
        state[chainId].metaDataLoaded = true;
      })
      .addCase(fetchWeightedPairMetaData.rejected, (state, { error },) => {
        state[state.currentChain].metaDataLoaded = false;
        console.log(error, state)
        console.error(error.message);
      }).addCase(fetchWeightedPairData.pending, state => {
        state[state.currentChain].reservesAndWeightsLoaded = false;
      })
      // 2) fetch reserves and weights for these pairs
      .addCase(fetchWeightedPairData.fulfilled, (state, action) => {
        const chainId = action.meta.arg.chainId
        // get keys for token pairs
        const keys = Object.keys(action.payload)
        for (let i = 0; i < keys.length; i++) {
          // get keys for weight-fee constellation
          const pairKeys = Object.keys(action.payload[keys[i]])
          for (let j = 0; j < pairKeys.length; j++) {
            // add the data
            if (!state[chainId].weightedPairs[keys[i]])
              state[chainId].weightedPairs[keys[i]] = {}

            state[chainId].weightedPairs[keys[i]][pairKeys[j]] = {
              ...state[chainId].weightedPairs[keys[i]][pairKeys[j]],
              ...action.payload[keys[i]][pairKeys[j]]
            };
          }
        }
        state[chainId].reservesAndWeightsLoaded = true;
      })
      .addCase(fetchWeightedPairData.rejected, (state, { error }) => {
        state[state.currentChain].reservesAndWeightsLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // 3) fetch reserves and weights for these pairs
      .addCase(fetchWeightedPairUserData.fulfilled, (state, action) => {
        const chainId = action.meta.arg.chainId
        // get keys for token pairs
        const keys = Object.keys(action.payload)
        for (let i = 0; i < keys.length; i++) {
          // get keys for weight-fee constellation
          const pairKeys = Object.keys(action.payload[keys[i]])
          for (let j = 0; j < pairKeys.length; j++) {
            // add the data
            if (!state[chainId].weightedPairs[keys[i]])
              state[chainId].weightedPairs[keys[i]] = {}

            if (state[chainId].weightedPairs[keys[i]][pairKeys[j]]) {
              state[chainId].weightedPairs[keys[i]][pairKeys[j]] = {
                ...state[chainId].weightedPairs[keys[i]][pairKeys[j]],
                ...action.payload[keys[i]][pairKeys[j]]
              };
            } else {
              state[chainId].weightedPairs[keys[i]][pairKeys[j]] = {
                ...action.payload[keys[i]][pairKeys[j]]
              };
            }
          }
        }
        state[chainId].userBalancesLoaded = true;
      })
      .addCase(fetchWeightedPairUserData.rejected, (state, { error }) => {
        state[state.currentChain].userBalancesLoaded = false;
        console.log(error, state)
        console.error(error.message);
      }) // reseres only updater
      .addCase(fetchWeightedPairReserves.pending, state => {
        state[state.currentChain].reservesAndWeightsLoaded = false;
      })
      // 2) fetch reserves and weights for these pairs
      .addCase(fetchWeightedPairReserves.fulfilled, (state, action) => {
        const chainId = action.meta.arg.chainId
        // get keys for token pairs
        const keys = Object.keys(action.payload)
        for (let i = 0; i < keys.length; i++) {
          // get keys for weight-fee constellation
          const pairKeys = Object.keys(action.payload[keys[i]])
          for (let j = 0; j < pairKeys.length; j++) {
            // add the data
            if (!state[chainId].weightedPairs[keys[i]])
              state[chainId].weightedPairs[keys[i]] = {}

            state[chainId].weightedPairs[keys[i]][pairKeys[j]] = {
              ...state[chainId].weightedPairs[keys[i]][pairKeys[j]],
              ...action.payload[keys[i]][pairKeys[j]]
            };
          }
        }
        state[chainId].reservesAndWeightsLoaded = true;
      })
      .addCase(fetchWeightedPairReserves.rejected, (state, { error }) => {
        state[state.currentChain].reservesAndWeightsLoaded = true;
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


