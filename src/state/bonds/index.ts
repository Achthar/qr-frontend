/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import isArchivedBondId from 'utils/bondHelpers'
import { bonds as bondList, bondList as bondsDict } from 'config/constants/bonds'
import { BondConfig } from 'config/constants/types'
import { getContractForReserve } from 'utils/contractHelpers';
import {
  fetchBondUserAllowancesAndBalances,
  fetchBondUserPendingPayoutData,
} from './fetchBondUser'
import { bnParser, calcSingleBondDetails } from './calcSingleBondDetails';
import { calcSingleBondStableLpDetails } from './calcSingleBondStableLpDetails';
import { BondsState, Bond } from '../types'


// import { chain } from 'lodash'


const chainIdFromState = 43113 // useAppSelector((state) => state.application.chainId)

function noAccountBondConfig(chainId: number) {
  return bondList(chainId).map((bond) => ({
    ...bond,
    userData: {
      allowance: '0',
      tokenBalance: '0',
      stakedBalance: '0',
      earnings: '0',
      pendingPayout: '0',
      interestDue: '0',
      balance: '0',
      bondMaturationBlock: 0,
      notes: {
        payout: '0',
        created: '0',
        matured: '0',
        redeemed: '0',
        marketId: '0',
      }
    },
    bond: '',
    allowance: 0,
    balance: '',
    interestDue: 0,
    bondMaturationBlock: 0,
    pendingPayout: '',
  }))
}

function initialState(chainId: number): BondsState {
  return {
    data: noAccountBondConfig(chainId),
    loadArchivedBondsData: false,
    userDataLoaded: false,
    status: 'idle',
    bondData: {}
  }
}

export function nonArchivedBonds(chainId: number): BondConfig[] { return bondList(chainId).filter(({ bondId }) => !isArchivedBondId(bondId)) }

interface BondUserDataResponse {
  bondId: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  pendingPayout: string
  interestDue: string
  balance: string
  bondMaturationBlock: number
  notes: {
    payout: string
    created: string
    matured: string
    redeemed: string
    marketId?: string
  }
}



export const fetchBondUserDataAsync = createAsyncThunk<BondUserDataResponse[], { chainId: number, account: string; bondIds: number[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ chainId, account, bondIds }) => {

    const bondsToFetch = bondList(chainId).filter((bondConfig) => bondIds.includes(bondConfig.bondId))

    const {
      allowances: userBondAllowances,
      balances: userBondTokenBalances
    } = await fetchBondUserAllowancesAndBalances(chainId, account, bondsToFetch)
    let notesFinal = []
    try {
      const {
        notes
      } = await fetchBondUserPendingPayoutData(chainId, account, bondsToFetch)
      notesFinal = notes
    } catch {
      notesFinal = []
    }
    const interestDue = notesFinal.map((info) => {
      return info.payout.toString();
    })
    console.log("BAM")
    return userBondAllowances.map((_, index) => {
      return {
        bondId: bondIds[index],
        allowance: userBondAllowances[index],
        tokenBalance: userBondTokenBalances[index],
        stakedBalance: 0, // userStakedBalances[index],
        earnings: 0, //  userBondEarnings[index],
        notes: {
          payout: notesFinal[index]?.payout?.toString(),
          created: notesFinal[index]?.created?.toString(),
          matured: notesFinal[index]?.matured?.toString(),
          redeemed: notesFinal[index]?.redeemed?.toString(),
          marketId: notesFinal[index]?.marketdId?.toString()
        },
        interestDue: interestDue[index],
        balance: userBondTokenBalances[index]
      }
    })
  },
)


export const bondsSlice = createSlice({
  name: 'Bonds',
  initialState: initialState(chainIdFromState), // TODO: make that more flexible
  reducers: {
    setLoadArchivedBondsData: (state, action) => {
      const loadArchivedBondsData = action.payload
      state.loadArchivedBondsData = loadArchivedBondsData
    },
    fetchBondSuccess(state, action) {
      state[action.payload.bond] = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Update bonds with live data
    builder
      .addCase(calcSingleBondDetails.pending, state => {
        state.userDataLoaded = false;
      })
      .addCase(calcSingleBondDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.bondData[bond.bondId] = { ...state.bondData[bond.bondId], ...action.payload };
        state.userDataLoaded = true;
      })
      .addCase(calcSingleBondDetails.rejected, (state, { error }) => {
        state.userDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      .addCase(calcSingleBondStableLpDetails.pending, state => {
        state.userDataLoaded = false;
      })
      .addCase(calcSingleBondStableLpDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.bondData[bond.bondId] = { ...state.bondData[bond.bondId], ...action.payload };
        state.userDataLoaded = true;
      })
      .addCase(calcSingleBondStableLpDetails.rejected, (state, { error }) => {
        state.userDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // Update bonds with user data
      .addCase(fetchBondUserDataAsync.fulfilled, (state, action) => {
        action.payload.forEach((userDataEl) => {
          state.bondData[userDataEl.bondId] = { ...state.bondData[userDataEl.bondId], userData: userDataEl }
        })
        state.userDataLoaded = true
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



// Actions
export const { setLoadArchivedBondsData } = bondsSlice.actions

export default bondsSlice.reducer
