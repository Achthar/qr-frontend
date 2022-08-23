/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { weightedSwapInitialData } from 'config/constants/weightedPool';
import { fetchWeightedPoolData } from './fetchWeightedPoolData';
import { PoolConfig } from '../types'
import { fetchPoolUserAllowancesAndBalances } from './fetchWeightedPoolUserData';
import { changeChainIdWeighted } from './actions';


function baseWeightedPool(chainId: number) {
  return weightedSwapInitialData[chainId]
}

function initialState(chainId: number) {
  return {
    pools: baseWeightedPool(chainId),
    publicDataLoaded: false,
    userDataLoaded: false
  }

}

interface PoolUserDataResponse {
  index: number
  allowances: string[]
  lpAllowance: string
  lpBalance: string
  userWithdarawFee: string
}



export const fetchWeightedPoolUserDataAsync = createAsyncThunk<PoolUserDataResponse[], { chainId: number, account: string; pools: PoolConfig[] }>(
  'weightedPools/fetchWeightedPoolsUserDataAsync',
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

const initialChainId = Number(process.env.REACT_APP_DEFAULT_CHAIN_ID)

export const weightedPoolSlice = createSlice({
  name: 'weghtedPools',
  initialState: {
    referenceChain: initialChainId,
    poolData: {
      43113: initialState(43113),
      42261: initialState(42261)

    }
  }, // TODO: make that more flexible
  reducers: {
  },
  extraReducers: (builder) => {
    // Update bonds with live data
    builder
      .addCase(fetchWeightedPoolData.pending, state => {
        // state.poolData[state.referenceChain].publicDataLoaded = false;
      })
      .addCase(fetchWeightedPoolData.fulfilled, (state, action) => {
        const pool = action.payload
        state.poolData[state.referenceChain].pools[pool.key] = { ...state.poolData[state.referenceChain].pools[pool.key], ...action.payload };
        state.poolData[state.referenceChain].publicDataLoaded = true;
      })
      .addCase(fetchWeightedPoolData.rejected, (state, { error }) => {
        state.poolData[state.referenceChain].publicDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // Update pools with user data
      .addCase(fetchWeightedPoolUserDataAsync.fulfilled, (state, action) => {
        action.payload.forEach((userDataEl) => {
          state.poolData[state.referenceChain].pools[userDataEl.index] = {
            ...state.poolData[state.referenceChain].pools[userDataEl.index],
            userData: userDataEl
          }
        })
        state.poolData[state.referenceChain].userDataLoaded = true
      }).addCase(changeChainIdWeighted, (state, action) => {
        const newId = action.payload.newChainId
        state.referenceChain = newId
        state.poolData[action.payload.newChainId] = initialState(newId)

      })
  },
})

export default weightedPoolSlice.reducer
