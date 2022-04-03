/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import isArchivedBondId from 'utils/bondHelpers'
import { bonds as bondList } from 'config/constants/bonds'
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
      notes: []
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
    bondData: {}, // noAccountBondConfig(chainId),
    loadArchivedBondsData: false,
    userDataLoaded: false,
    status: 'idle'
  }
}

export function nonArchivedBonds(chainId: number): BondConfig[] { return bondList(chainId).filter(({ bondId }) => !isArchivedBondId(bondId)) }

interface BondUserDataResponse {
  // bondId: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  pendingPayout: string
  interestDue: string
  balance: string
  bondMaturationBlock: number
  notes: [{
    payout: string
    created: number
    matured: number
    redeemed: string
    marketId: number
    noteIndex: number
  }]
}



export const fetchBondUserDataAsync = createAsyncThunk<{ [bondId: number]: BondUserDataResponse }, { chainId: number, account: string; bondIds: number[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ chainId, account, bondIds }) => {

    const bondsToFetch = bondList(chainId).filter((bondConfig) => bondIds.includes(bondConfig.bondId))

    const {
      allowances: userBondAllowances,
      balances: userBondTokenBalances
    } = await fetchBondUserAllowancesAndBalances(chainId, account, bondsToFetch)
    let notesFinal = []
    // try {
    const {
      notes
    } = await fetchBondUserPendingPayoutData(chainId, account)
    notesFinal = notes
    // } catch {
    //   notesFinal = []
    // }
    const interestDue = notesFinal.map((info) => {
      return info.payout.toString();
    })

    console.log("NOTES b4 ST", userBondAllowances.map((_, index) => {
      console.log("NOTES INDEX", index, notesFinal.filter(note => note.marketId === bondIds[index]))
      return {
        // bondId: bondIds[index],
        allowance: userBondAllowances[index],
        tokenBalance: userBondTokenBalances[index],
        stakedBalance: 0, // userStakedBalances[index],
        earnings: 0, //  userBondEarnings[index],
        notes: notesFinal.filter(note => note.marketId === bondIds[index]).map(note => {
          return {
            payout: note[index]?.payout,
            created: note[index]?.created,
            matured: note[index]?.matured,
            redeemed: note[index]?.redeemed,
            marketId: note[index]?.marketdId
          }
        }),
        interestDue: interestDue[index],
        balance: userBondTokenBalances[index]
      }
    }))

    return Object.assign({}, ...userBondAllowances.map((_, index) => {
      console.log("NOTES INDEX", index, notesFinal.filter(note => note.marketId === bondIds[index]))
      return {
        [bondIds[index]]: {
          bondId: bondIds[index],
          allowance: userBondAllowances[index],
          tokenBalance: userBondTokenBalances[index],
          stakedBalance: 0, // userStakedBalances[index],
          earnings: 0, //  userBondEarnings[index],
          notes: notesFinal.filter(note => note.marketId === bondIds[index]),
          interestDue: interestDue[index],
          balance: userBondTokenBalances[index]
        }
      }
    })
    )
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

        console.log("NOTES USER PAYLOAD", action.payload)
        Object.keys(action.payload).forEach((bondId) => {
          console.log("NOTES ID", bondId, action.payload[bondId], state.bondData[bondId])
          state.bondData[bondId].userData = { ...state.bondData[bondId].userData, ...action.payload[bondId] }
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
