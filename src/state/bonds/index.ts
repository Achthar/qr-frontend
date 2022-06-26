/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import isArchivedBondId from 'utils/bondHelpers'
import { BondConfig, BondType } from 'config/constants/types'
import multicall from 'utils/multicall';
import { getBondingDepositoryAddress, getCallBondingDepositoryAddress } from 'utils/addressHelpers';
import { getAddress } from 'ethers/lib/utils';
import bondReserveAVAX from 'config/abi/avax/BondDataProvider.json'
import {
  fetchBondUserAllowancesAndBalances,
  fetchBondUserPendingPayoutData,
  fetchCallBondUserAllowancesAndBalances,
  fetchCallBondUserPendingPayoutData,
  fetchUserClosedMarkets,
} from './fetchBondUser'
import { calcSingleBondDetails } from './calcSingleBondDetails';
import { calcSingleBondStableLpDetails } from './calcSingleBondStableLpDetails';
import { BondsState, Bond } from '../types'
import { setLpLink, setLpPrice } from './actions';
import { calcSingleCallBondPoolDetails } from './calcSingleCallBondPoolDetails';

function initialState(): BondsState {
  return {
    bondData: {},
    callBondData: {},
    loadArchivedBondsData: false,
    userDataLoaded: false,
    userCallDataLoading: false,
    userCallDataLoaded: false,
    metaLoaded: false,
    userDataLoading: false,
    publicDataLoading: false,
    userReward: '0',
    userRewardCall: '0',
    status: 'idle',
    vanillaNotesClosed: [],
    callNotesClosed: [],
    vanillaMarketsClosed: [],
    callMarketsClosed: [],
    closedMarketsLoaded: false
  }
}

interface UserTerms {
  payout: string
  created: number
  matured: number
  redeemed: string
  marketId: number
  noteIndex: number
}



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
  notes: UserTerms[]
}


interface CallUserTerms {
  payout: string
  created: number
  matured: number
  redeemed: string
  marketId: number
  noteIndex: number
  cryptoIntitialPrice: string
}



interface CallBondUserDataResponse {
  // bondId: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  pendingPayout: string
  interestDue: string
  balance: string
  bondMaturationBlock: number
  notes: UserTerms[]
}



export const fetchBondMeta = createAsyncThunk<{ bondConfigWithIds: BondConfig[], callBondConfigWithIds: BondConfig[] }, { chainId: number, bondMeta: BondConfig[] }>(
  'bonds/fetchBondMeta',
  async ({ chainId, bondMeta }) => {
    const addresses = bondMeta.map(cfg => getAddress(cfg.reserveAddress[chainId]))
    const depoAddress = getBondingDepositoryAddress(chainId)
    const callDepoAddress = getCallBondingDepositoryAddress(chainId)
    // fetch all bond data for provided assets addresses
    const calls = addresses.map(_address => {
      return {
        address: depoAddress,
        name: 'liveMarketsFor',
        params: [_address]
      }
    })

    const callBondCalls = addresses.map(_address => {
      return {
        address: callDepoAddress,
        name: 'liveMarketsFor',
        params: [_address]
      }
    })

    const bondIds = await multicall(chainId, bondReserveAVAX, [...calls, ...callBondCalls])

    const bondCfgs = []
    const callBondCfgs = []

    for (let j = 0; j < addresses.length; j++) {
      // vanillas
      const availableIds = bondIds[j][0].map(id => Number(id.toString()))
      // call bonds
      const availableCallBondIds = bondIds[addresses.length + j][0].map(id => Number(id.toString()))

      const address = addresses[j]
      const bondData = bondMeta.find(
        _bond => {
          return getAddress(_bond.reserveAddress[chainId]) === getAddress(address)
        }
      )

      for (let k = 0; k < availableIds.length; k++) {
        const _bondToAdd = { ...bondData }
        _bondToAdd.bondId = availableIds[k]
        _bondToAdd.bondType = BondType.Vanilla
        bondCfgs.push(_bondToAdd)
      }

      for (let k = 0; k < availableCallBondIds.length; k++) {
        const _callBondToAdd = { ...bondData }
        _callBondToAdd.bondId = availableCallBondIds[k]
        _callBondToAdd.bondType = BondType.Call
        callBondCfgs.push(_callBondToAdd)
      }

    }

    return {
      bondConfigWithIds: bondCfgs,
      callBondConfigWithIds: callBondCfgs
    }

  },
)

export const fetchBondUserDataAsync = createAsyncThunk<{ closedNotes: UserTerms[], dataAssignedToBonds: { rewards: string, bondUserData: { [bondId: number]: BondUserDataResponse } } }, { chainId: number, account: string; bonds: BondConfig[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ chainId, account, bonds }) => {

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

    const bondIds: number[] = bonds.map(b => b.bondId)
    return {
      dataAssignedToBonds: {
        rewards: reward,
        bondUserData: Object.assign({}, ...userBondAllowances.map((_, index) => {
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
      closedNotes: notesFinal.filter((n) => !bondIds.includes(n.marketId))
    }
  },
)


export const fetchCallBondUserDataAsync = createAsyncThunk<{ closedNotes: CallUserTerms[], dataAssignedToBonds: { rewards: string, bondUserData: { [bondId: number]: CallBondUserDataResponse } } }, { chainId: number, account: string; bonds: BondConfig[] }>(
  'bonds/fetchCallBondUserDataAsync',
  async ({ chainId, account, bonds }) => {

    const {
      allowances: userBondAllowances,
      balances: userBondTokenBalances
    } = await fetchCallBondUserAllowancesAndBalances(chainId, account, bonds)

    let notesFinal = []
    const {
      notes,
      reward
    } = await fetchCallBondUserPendingPayoutData(chainId, account)
    notesFinal = notes

    const interestDue = notesFinal.map((info) => {
      return info.payout.toString();
    })

    const bondIds: number[] = bonds.map(b => b.bondId)

    return {
      dataAssignedToBonds: {
        rewards: reward,
        bondUserData: Object.assign({}, ...userBondAllowances.map((_, index) => {
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
      closedNotes: notesFinal.filter((n) => !bondIds.includes(n.marketId))
    }
  },
)


interface RawMarket {
  asset: string
  underlying?: string;
  sold: string;
  purchased: string;
}


export const fetchClosedBondsUserAsync = createAsyncThunk<{ vanillaMarkets: RawMarket[], callMarkets: RawMarket[] }, { chainId: number, bIds: number[]; bIdsC: number[] }>(
  'bonds/fetchClosedBondsUserAsync',
  async ({ chainId, bIds, bIdsC }) => {

    const {
      closedVanillaMarkets: _closedVanillaMarkets,
      closedCallMarkets: _closedCallMarkets
    } = await fetchUserClosedMarkets(chainId, bIds, bIdsC)

    return {
      vanillaMarkets: Object.assign({}, ..._closedVanillaMarkets.map((_, index) => {
        return {
          [bIds[index]]: {
            asset: _closedVanillaMarkets[index].asset,
            sold: _closedVanillaMarkets[index].sold.toString(),
            purchased: _closedVanillaMarkets[index].purchased.toString()
          }
        }
      })
      ),
      callMarkets: Object.assign({}, ..._closedCallMarkets.map((_, index) => {
        return {
          [bIdsC[index]]: {
            asset: _closedCallMarkets[index].asset,
            underlying: _closedCallMarkets[index].underlying,
            sold: _closedCallMarkets[index].sold.toString(),
            purchased: _closedCallMarkets[index].purchased.toString()
          }
        }
      })
      )
    }
  },
)


export const bondsSlice = createSlice({
  name: 'Bonds',
  initialState: initialState(), // TODO: make that more flexible
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
      // metadata fetch
      .addCase(fetchBondMeta.pending, state => {
        // state.metaLoaded = false;
      })
      .addCase(fetchBondMeta.fulfilled, (state, action) => {
        const { bondConfigWithIds, callBondConfigWithIds } = action.payload
        for (let i = 0; i < bondConfigWithIds.length; i++) {
          const bond = bondConfigWithIds[i]
          state.bondData[bond.bondId] = { ...state.bondData[bond.bondId], ...bond };
        }

        for (let i = 0; i < callBondConfigWithIds.length; i++) {
          const bond = callBondConfigWithIds[i]
          state.callBondData[bond.bondId] = { ...state.callBondData[bond.bondId], ...bond };
        }
        state.metaLoaded = true;
      })
      .addCase(fetchBondMeta.rejected, (state, { error }) => {
        state.metaLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // public detail fetch
      .addCase(calcSingleBondDetails.pending, state => {
        state.userDataLoading = true;
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
      // Vanilla Bond
      // detail fetch for stable pool (and currently weighted pool)
      .addCase(calcSingleBondStableLpDetails.pending, state => {
        // state.userDataLoaded = false;
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
      // Call Bond
      // detail fetch for stable pool (and currently weighted pool)
      .addCase(calcSingleCallBondPoolDetails.pending, state => {
        // state.userDataLoaded = false;
      })
      .addCase(calcSingleCallBondPoolDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.callBondData[bond.bondId] = { ...state.callBondData[bond.bondId], ...action.payload };
        state.userDataLoaded = true;
      })
      .addCase(calcSingleCallBondPoolDetails.rejected, (state, { error }) => {
        state.userDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // Update bonds with user data
      .addCase(fetchBondUserDataAsync.fulfilled, (state, action) => {
        const bondData = action.payload.dataAssignedToBonds
        Object.keys(bondData.bondUserData).forEach((bondId) => {
          state.bondData[bondId].userData = { ...state.bondData[bondId].userData, ...bondData.bondUserData[bondId] }
        })
        state.vanillaNotesClosed = action.payload.closedNotes
        state.userReward = bondData.rewards
        state.userDataLoaded = true
      }).addCase(fetchBondUserDataAsync.pending, state => {
        state.userDataLoading = true;
      }).addCase(fetchBondUserDataAsync.rejected, (state, { error }) => {
        state.userDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // Update call bonds with user data
      .addCase(fetchCallBondUserDataAsync.fulfilled, (state, action) => {
        const callBondData = action.payload.dataAssignedToBonds
        Object.keys(callBondData.bondUserData).forEach((bondId) => {
          state.callBondData[bondId].userData = { ...state.callBondData[bondId].userData, ...callBondData.bondUserData[bondId] }
        })
        state.callNotesClosed = action.payload.closedNotes
        state.userRewardCall = callBondData.rewards
        state.userCallDataLoaded = true
      }).addCase(fetchCallBondUserDataAsync.pending, state => {
        state.userDataLoading = true;
      }).addCase(fetchCallBondUserDataAsync.rejected, (state, { error }) => {
        state.userCallDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // get Closed Markets
      .addCase(fetchClosedBondsUserAsync.fulfilled, (state, action) => {
        state.vanillaMarketsClosed = action.payload.vanillaMarkets
        state.callMarketsClosed = action.payload.callMarkets
        state.closedMarketsLoaded = true
      })
      // .addCase(fetchClosedBondsUserAsync.pending, state => {
      // })
      .addCase(fetchClosedBondsUserAsync.rejected, (state, { error }) => {
        state.closedMarketsLoaded = true
        console.log(error, state)
        console.error(error.message);
      })
      // setters for prices calculated with pools and links
      .addCase(setLpPrice, (state, action) => {
        if (action.payload.bondType === BondType.Vanilla) {
          state.bondData[action.payload.bondId].purchasedInQuote = action.payload.price
        }
        if (action.payload.bondType === BondType.Call) {
          state.callBondData[action.payload.bondId].purchasedInQuote = action.payload.price
        }
      })
      .addCase(setLpLink, (state, action) => {
        if (action.payload.bondType === BondType.Vanilla) {
          state.bondData[action.payload.bondId].lpLink = action.payload.link
        }

        if (action.payload.bondType === BondType.Call) {
          state.callBondData[action.payload.bondId].lpLink = action.payload.link
        }
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
