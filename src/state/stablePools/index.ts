/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import isArchivedBondId from 'utils/bondHelpers'
import { bonds as bondList, bondList as bondsDict } from 'config/constants/bonds'
import { BondConfig } from 'config/constants/types'
import { stableSwapInitialData } from 'config/constants/stablePools';
import { getContractForReserve } from 'utils/contractHelpers';
import { bnParser, fetchStablePoolData } from './fetchStablePoolData';
import { StablePoolConfig, StablePoolsState } from '../types'
import { fetchPoolUserAllowancesAndBalances } from './fetchStablePoolUserData';
import { changeChainId } from './actions';


// import { chain } from 'lodash'


const chainIdFromState = 43113 // useAppSelector((state) => state.application.chainId)

function baseStablePool(chainId: number) {
  return stableSwapInitialData[chainId]
}

function initialState(chainId: number): StablePoolsState {
  return {
    pools: baseStablePool(chainId),
    publicDataLoaded: false,
    userDataLoaded: false
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
  name: 'stablePools',
  initialState: initialState(chainIdFromState), // TODO: make that more flexible
  reducers: {
  },
  extraReducers: (builder) => {
    // Update bonds with live data
    builder
      .addCase(fetchStablePoolData.pending, state => {
        state.publicDataLoaded = false;
      })
      .addCase(fetchStablePoolData.fulfilled, (state, action) => {
        const pool = action.payload
        state.pools[pool.key] = { ...state.pools[pool.key], ...action.payload };
        state.publicDataLoaded = true;
      })
      .addCase(fetchStablePoolData.rejected, (state, { error }) => {
        state.publicDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // Update pools with user data
      .addCase(fetchStablePoolUserDataAsync.fulfilled, (state, action) => {
        action.payload.forEach((userDataEl) => {
          state.pools[userDataEl.index] = { ...state.pools[userDataEl.index], userData: userDataEl }
        })
        state.userDataLoaded = true
      }).addCase(changeChainId, (state, action) => {
        state = initialState(action.payload.newChainId)
      })
  },
})


export interface IUserBondDetails {
  // bond: string;
  allowance: number;
  interestDue: number;
  bondMaturationBlock: number;
  pendingPayout: string; // Payout formatted in gwei.
}

export interface IBondData extends IUserBondDetails {
  bondId: number
  bond: string
  displayName: string
  isLP: boolean
  allowance: number
  balance: string
  interestDue: number
  bondMaturationBlock: number
  pendingPayout: string

}

export default stablePoolSlice.reducer
