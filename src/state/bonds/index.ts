/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import isArchivedBondId from 'utils/bondHelpers'
import { bonds as bondList } from 'config/constants/bonds'
import { BondConfig } from 'config/constants/types'
import multicall from 'utils/multicall';
import { getBondingDepositoryAddress } from 'utils/addressHelpers';
import { getAddress } from 'ethers/lib/utils';
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import {
  fetchBondUserAllowancesAndBalances,
  fetchBondUserPendingPayoutData,
} from './fetchBondUser'
import { calcSingleBondDetails } from './calcSingleBondDetails';
import { calcSingleBondStableLpDetails } from './calcSingleBondStableLpDetails';
import { BondsState, Bond } from '../types'
import { setLpPrice } from './actions';


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
    metaLoaded: false,
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


export const fetchBondMeta = createAsyncThunk<{ bondConfigWithIds: BondConfig[] }, { chainId: number, bondMeta: BondConfig[] }>(
  'bonds/fetchBondMeta',
  async ({ chainId, bondMeta }) => {
    const addresses = bondMeta.map(cfg => getAddress(cfg.reserveAddress[chainId]))
    const depoAddress = getBondingDepositoryAddress(chainId)
    // fetch all bond data for provided assets addresses
    const calls = addresses.map(_address => {
      return {
        address: depoAddress,
        name: 'liveMarketsFor',
        params: [_address]
      }
    })

    const bondIds = await multicall(chainId, bondReserveAVAX, calls)
    const bondCfgs = []
    for (let j = 0; j < addresses.length; j++) {
      const availableIds = bondIds[j][0].map(id => Number(id.toString()))
      const address = addresses[j]
      const bondData = bondMeta.find(
        _bond => {
          return getAddress(_bond.reserveAddress[chainId]) === getAddress(address)
        }
      )

      for (let k = 0; k < availableIds.length; k++) {
        const _bondToAdd = { ...bondData }
        _bondToAdd.bondId = availableIds[k]
        bondCfgs.push(_bondToAdd)
      }

    }

    return {
      bondConfigWithIds: bondCfgs
    }

  },
)

export const fetchBondUserDataAsync = createAsyncThunk<{ [bondId: number]: BondUserDataResponse }, { chainId: number, account: string; bonds: BondConfig[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ chainId, account, bonds }) => {

    // const bondsToFetch = bondList(chainId).filter((bondConfig) => bondIds.includes(bondConfig.bondId))

    const {
      allowances: userBondAllowances,
      balances: userBondTokenBalances
    } = await fetchBondUserAllowancesAndBalances(chainId, account, bonds)

    let notesFinal = []
    const {
      notes,
      reward
    } = await fetchBondUserPendingPayoutData(chainId, account)
    notesFinal = notes

    const interestDue = notesFinal.map((info) => {
      return info.payout.toString();
    })

    const bondIds = bonds.map(b => b.bondId)
    return Object.assign({}, ...userBondAllowances.map((_, index) => {
      return {
        [bondIds[index]]: {
          bondId: bondIds[index],
          allowance: userBondAllowances[index],
          tokenBalance: userBondTokenBalances[index],
          stakedBalance: 0, // userStakedBalances[index],
          earnings: reward, //  userBondEarnings[index],
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
      .addCase(fetchBondMeta.pending, state => {
        state.metaLoaded = false;
      })
      .addCase(fetchBondMeta.fulfilled, (state, action) => {
        const { bondConfigWithIds } = action.payload
        for (let i = 0; i < bondConfigWithIds.length; i++) {
          const bond = bondConfigWithIds[i]
          state.bondData[bond.bondId] = { ...state.bondData[bond.bondId], ...bond };
        }
        state.metaLoaded = true;
      })
      .addCase(fetchBondMeta.rejected, (state, { error }) => {
        state.metaLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
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
      }).addCase(fetchBondUserDataAsync.pending, state => {
        state.userDataLoaded = false;
      }).addCase(fetchBondUserDataAsync.rejected, (state, { error }) => {
        state.userDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      .addCase(setLpPrice, (state, action) => {
        state.bondData[action.payload.bondId].purchasedInQuote = action.payload.price
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
