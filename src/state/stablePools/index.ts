/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { stableSwapInitialData } from 'config/constants/stablePools';
import { fetchStablePoolData } from './fetchStablePoolData';
import { PoolConfig } from '../types'
import { fetchPoolUserAllowancesAndBalances } from './fetchStablePoolUserData';
import { changeChainIdStables } from './actions';


function baseStablePool(chainId: number) {
  return stableSwapInitialData[chainId]
}

function initialState(chainId: number) {
  return {
    pools: baseStablePool(chainId),
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



export const fetchStablePoolUserDataAsync = createAsyncThunk<PoolUserDataResponse[], { chainId: number, account: string; pools: PoolConfig[] }>(
  'stablePools/fetchStablePoolsUserDataAsync',
  async ({ chainId, account, pools }) => {
    if (pools.length === 0) return []

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
  name: 'stablePools',
  initialState: {
    referenceChain: 43113,
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
      .addCase(fetchStablePoolData.pending, state => {
        // state.poolData[state.referenceChain].publicDataLoaded = false;
      })
      .addCase(fetchStablePoolData.fulfilled, (state, action) => {
        const pool = action.payload
        state.poolData[state.referenceChain].pools[pool.key] = { ...state.poolData[state.referenceChain].pools[pool.key], ...action.payload };
        state.poolData[state.referenceChain].publicDataLoaded = true;
      })
      .addCase(fetchStablePoolData.rejected, (state, { error }) => {
        state.poolData[state.referenceChain].publicDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // Update pools with user data
      .addCase(fetchStablePoolUserDataAsync.fulfilled, (state, action) => {
        action.payload.forEach((userDataEl) => {
          state.poolData[state.referenceChain].pools[userDataEl.index] = {
            ...state.poolData[state.referenceChain].pools[userDataEl.index],
            userData: userDataEl
          }
        })
        state.poolData[state.referenceChain].userDataLoaded = true
      }).addCase(changeChainIdStables, (state, action) => {
        const newId = action.payload.newChainId
        state.referenceChain = newId
        state.poolData[action.payload.newChainId] = initialState(newId)

      })
  },
})

export default stablePoolSlice.reducer
