/** eslint no-empty-interface: 0 */
import { createSlice } from '@reduxjs/toolkit'
import { getAllTokenPairs } from 'config/constants/tokenPairs';
import { fetchWeightedPairMetaData } from './fetchWeightedPairMetaData';
import { addTokenPair, changeChainIdWeighted, metaDataChange, setMetdataLoaded, triggerRefreshUserData } from './actions';
import { fetchWeightedPairData, fetchWeightedPairReserves, fetchWeightedPairUserData } from './fetchWeightedPairData';

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

const initialChainId = Number(process.env.REACT_APP_DEFAULT_CHAIN_ID)

export const stablePoolSlice = createSlice({
  name: 'weightedPairs',
  initialState: {
    currentChain: initialChainId,
    43113: initialState(43113),
    42261: initialState(42261)
  }, // TODO: make that more flexible
  reducers: {       // 0) chainmId change - new init
    // resetWeightedPairChainId: (state, action) => {
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
        // state[action.meta.arg.chainId].metaDataLoaded = false;
      })
      .addCase(fetchWeightedPairMetaData.fulfilled, (state, action) => {
        const chainId = action.meta.arg.chainId
        // add metadata to state
        state[chainId].weightedPairMeta = { ...state[chainId].weightedPairMeta, ...action.payload.metaData }
        state[chainId].tokenPairs = action.payload.currentPairs
        // initialize weighted pairs
        state[chainId].weightedPairs = {}
        state[chainId].metaDataLoaded = true;
        state[chainId].reservesAndWeightsLoaded = false;
      })
      .addCase(fetchWeightedPairMetaData.rejected, (state, { error },) => {
        state[state.currentChain].metaDataLoaded = false;
        console.log(error, state)
        console.error(error.message);
      }).addCase(fetchWeightedPairData.pending, state => {
        // state[state.currentChain].reservesAndWeightsLoaded = false;
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
        // state[state.currentChain].reservesAndWeightsLoaded = false;
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
      .addCase(addTokenPair, (state, action) => {
        state[state.currentChain].metaDataLoaded = false;
        state[state.currentChain].reservesAndWeightsLoaded = false;
        state[state.currentChain].tokenPairs.push(action.payload.tokenPair)
      }).addCase(setMetdataLoaded, (state, action) => {
        state[state.currentChain].metaDataLoaded = false;
      })
  },
})

// export const {resetWeightedPairChainId} = stablePoolSlice.actions

export default stablePoolSlice.reducer


