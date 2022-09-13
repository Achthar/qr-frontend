/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { FALLBACK_CHAINID } from 'config/constants'
import { BondConfig, BondType } from 'config/constants/types'
import multicall from 'utils/multicall';
import { getBondingDepositoryAddress, getCallableBondingDepositoryAddress, getDigitalBondingDepositoryAddress } from 'utils/addressHelpers';
import { getAddress } from 'ethers/lib/utils';
import bondReserveAVAX from 'config/abi/avax/BondDataProvider.json'
import {
  fetchBondUserAllowancesAndBalances,
  fetchBondUserPendingPayoutData,
  fetchCallableBondUserAllowancesAndBalances,
  fetchCallableBondUserPendingPayoutData,
  fetchCallBondUserAllowancesAndBalances,
  fetchCallBondUserPendingPayoutData,
  fetchUserClosedMarkets,
} from './fetchBondUser'
import { calcSingleBondDetails } from './vanilla/calcSingleBondDetails';
import { calcSingleBondStableLpDetails } from './vanilla/calcSingleBondStableLpDetails';
import { BondsState, Bond } from '../types'
import { changeChainIdBonds, setLpLink, setLpPrice } from './actions';
import { calcSingleDigitalBondPoolDetails } from './digital/calcSingleDigitalBondPoolDetails';
import { calcSingleDigitalBondDetails } from './digital/calcSingleDigitalBondDetails';
import { calcSingleCallableBondDetails } from './callable/calcSingleCallBondDetails';
import { calcSingleCallableBondPoolDetails } from './callable/calcSingleCallBondPoolDetails';

function initialState(_chainId: number): BondsState {
  return {
    referenceChainId: _chainId,
    bonds: {
      43113: {
        bondData: {},
        digitalBondData: {},
        callableBondData: {},
      },
      42261: {
        bondData: {},
        digitalBondData: {},
        callableBondData: {},
      }
    },
    loadArchivedBondsData: false,
    userDataLoaded: false,
    userDigitalDataLoading: false,
    userDigitalDataLoaded: false,
    userCallableDataLoaded: false,
    metaLoaded: false,
    userDataLoading: false,
    publicDataLoading: false,
    userReward: '0',
    userRewardDigital: '0',
    userRewardCallable: '0',
    status: 'idle',
    closedNotes: {
      43113: {
        vanillaNotesClosed: [],
        digitalNotesClosed: [],
        callableNotesClosed: [],
      },
      42261: {
        vanillaNotesClosed: [],
        digitalNotesClosed: [],
        callableNotesClosed: [],
      }
    },
    bondsClosed: {
      43113: {
        vanillaBondsClosed: [],
        callBondsClosed: [],
        callableBondsClosed: [],
      },
      42261: {
        vanillaBondsClosed: [],
        callBondsClosed: [],
        callableBondsClosed: [],
      }
    },
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

interface CallableUserTerms {
  payout: string
  created: number
  matured: number
  exercised: string
  marketId: number
  noteIndex: number
  cryptoIntitialPrice: string
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



export const fetchBondMeta = createAsyncThunk<{ bondConfigWithIds: BondConfig[], callBondConfigWithIds: BondConfig[], callableBondConfigWithIds: BondConfig[] }, { chainId: number, bondMeta: BondConfig[] }>(
  'bonds/fetchBondMeta',
  async ({ chainId, bondMeta }) => {
    const addresses = bondMeta.map(cfg => getAddress(cfg.reserveAddress[chainId]))
    const depoAddress = getBondingDepositoryAddress(chainId)
    const callDepoAddress = getDigitalBondingDepositoryAddress(chainId)
    const callableDepoAddress = getCallableBondingDepositoryAddress(chainId)
    // fetch all bond data for provided assets addresses
    const calls = addresses.map(_address => {
      return {
        address: depoAddress,
        name: 'liveMarketsFor',
        params: [_address]
      }
    })

    const callBondCalls = callDepoAddress ? addresses.map(_address => {
      return {
        address: callDepoAddress,
        name: 'liveMarketsFor',
        params: [_address]
      }
    }) : []

    const callableBondCalls = callableDepoAddress ? addresses.map(_address => {
      return {
        address: callableDepoAddress,
        name: 'liveMarketsFor',
        params: [_address]
      }
    }) : []

    const bondIds = await multicall(chainId, bondReserveAVAX, [...calls, ...callBondCalls, ...callableBondCalls])

    const bondCfgs = []
    const callBondCfgs = []
    const callableBondCfgs = []

    for (let j = 0; j < addresses.length; j++) {
      // vanillas
      const availableIds = bondIds[j]?.[0].map(id => Number(id.toString()))
      // call bonds
      const availableCallBondIds = callDepoAddress ? bondIds?.[addresses.length + j]?.[0]?.map(id => Number(id.toString())) : []
      // callable bonds
      const availableCallableBondIds = callableDepoAddress ? bondIds?.[(callDepoAddress ? 2 : 1) * addresses.length + j]?.[0].map(id => Number(id.toString())) : []

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
        _bondToAdd.publicLoaded = false
        _bondToAdd.userLoaded = false
        bondCfgs.push(_bondToAdd)
      }

      for (let k = 0; k < availableCallBondIds.length; k++) {
        const _callBondToAdd = { ...bondData }
        _callBondToAdd.bondId = availableCallBondIds[k]
        _callBondToAdd.bondType = BondType.Call
        _callBondToAdd.publicLoaded = false
        _callBondToAdd.userLoaded = false
        callBondCfgs.push(_callBondToAdd)
      }
      for (let k = 0; k < availableCallableBondIds.length; k++) {
        const _callableBondToAdd = { ...bondData }
        _callableBondToAdd.bondId = availableCallableBondIds[k]
        _callableBondToAdd.bondType = BondType.Callable
        _callableBondToAdd.publicLoaded = false
        _callableBondToAdd.userLoaded = false
        callableBondCfgs.push(_callableBondToAdd)
      }
    }

    return {
      bondConfigWithIds: bondCfgs,
      callBondConfigWithIds: callBondCfgs,
      callableBondConfigWithIds: callableBondCfgs
    }
  },
)

export const fetchBondUserDataAsync = createAsyncThunk<{ closedNotes: UserTerms[], dataAssignedToBonds: { rewards: string, bondUserData: { [bondId: number]: BondUserDataResponse } } }, { chainId: number, account: string; bonds: BondConfig[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ chainId, account, bonds }) => {
    if (bonds.length === 0) return { closedNotes: [], dataAssignedToBonds: { rewards: '0', bondUserData: {} } }

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
    if (bonds.length === 0) return { closedNotes: [], dataAssignedToBonds: { rewards: '0', bondUserData: {} } }

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



export const fetchCallableBondUserDataAsync = createAsyncThunk<{ closedNotes: CallableUserTerms[], dataAssignedToBonds: { rewards: string, bondUserData: { [bondId: number]: CallBondUserDataResponse } } }, { chainId: number, account: string; bonds: BondConfig[] }>(
  'bonds/fetchCallableBondUserDataAsync',
  async ({ chainId, account, bonds }) => {
    if (bonds.length === 0) return { closedNotes: [], dataAssignedToBonds: { rewards: '0', bondUserData: {} } }

    const {
      allowances: userBondAllowances,
      balances: userBondTokenBalances
    } = await fetchCallableBondUserAllowancesAndBalances(chainId, account, bonds)

    let notesFinal = []
    const {
      notes,
      reward
    } = await fetchCallableBondUserPendingPayoutData(chainId, account)
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

interface RawTerm {
  vesting: number
  thresholdPercentage?: string;
  maxPayoffPercentage?: string;
  payoffPercentage?: string;
  exerciseDuration?: number;
}

interface RawBond {
  market: RawMarket
  terms: RawTerm
}

interface RawCallMarket extends RawMarket {
  underlying: string;

}

interface RawCallTerm extends RawTerm {
  thresholdPercentage: string;
  payoffPercentage: string;
  exerciseDuration: number;
}

interface RawCallableTerm extends RawTerm {
  thresholdPercentage: string;
  maxPayoffPercentage: string;
  exerciseDuration: number;
}


interface RawCallBond {
  market: RawCallMarket
  terms: RawCallTerm
}

interface RawCallableBond {
  market: RawCallMarket
  terms: RawCallableTerm
}



export const fetchClosedBondsUserAsync = createAsyncThunk<{ vanillaMarkets: RawBond[], callMarkets: RawCallBond[], callableMarkets: RawCallableBond[] }, { chainId: number, bIds: number[]; bIdsC: number[], bIdsCallable: number[] }>(
  'bonds/fetchClosedBondsUserAsync',
  async ({ chainId, bIds, bIdsC, bIdsCallable }) => {

    const {
      closedVanillaMarkets: _closedVanillaMarkets,
      closedVanillaTerms: _closedVanillaTerms,

      closedCallMarkets: _closedCallMarkets,
      closedCallTerms: _closedCallTerms,

      closedCallableTerms: _closedCallableTerms,
      closedCallableMarkets: _closedCallableMarkets,
    } = await fetchUserClosedMarkets(chainId, bIds, bIdsC, bIdsCallable)

    return {
      vanillaMarkets: Object.assign({}, ..._closedVanillaMarkets.map((_, index) => {
        return {
          [bIds[index]]: {
            market: {
              asset: _closedVanillaMarkets[index].asset,
              sold: _closedVanillaMarkets[index].sold.toString(),
              purchased: _closedVanillaMarkets[index].purchased.toString()
            },
            terms: {
              vesting: Number(_closedVanillaTerms[index].vesting)
            }
          }
        }
      })
      ),
      callMarkets: Object.assign({}, ..._closedCallMarkets.map((_, index) => {
        return {
          [bIdsC[index]]: {
            market: {
              asset: _closedCallMarkets[index].asset,
              underlying: _closedCallMarkets[index].underlying,
              sold: _closedCallMarkets[index].sold.toString(),
              purchased: _closedCallMarkets[index].purchased.toString()
            },
            terms: {
              vesting: Number(_closedCallTerms[index].vesting),
              thresholdPercentage: _closedCallTerms[index].thresholdPercentage.toString(),
              payoffPercentage: _closedCallTerms[index].payoffPercentage.toString(),
              exerciseDuration: Number(_closedCallTerms[index].exerciseDuration)
            }
          }
        }
      })
      ),
      callableMarkets: Object.assign({}, ..._closedCallableMarkets.map((_, index) => {
        return {
          [bIdsCallable[index]]: {
            market: {
              asset: _closedCallableMarkets[index].asset,
              underlying: _closedCallableMarkets[index].underlying,
              sold: _closedCallableMarkets[index].sold.toString(),
              purchased: _closedCallableMarkets[index].purchased.toString()
            },
            terms: {
              vesting: Number(_closedCallableTerms[index].vesting),
              thresholdPercentage: _closedCallableTerms[index].thresholdPercentage.toString(),
              maxPayoffPercentage: _closedCallableTerms[index].maxPayoffPercentage.toString(),
              exerciseDuration: Number(_closedCallableTerms[index].exerciseDuration)
            }
          }
        }
      })
      )
    }
  },
)


const initialChainId = Number(process?.env?.REACT_APP_DEFAULT_CHAIN_ID ?? FALLBACK_CHAINID)

export const bondsSlice = createSlice({
  name: 'Bonds',
  initialState: initialState(initialChainId), // TODO: make that more flexible
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
      .addCase(changeChainIdBonds, (state, action) => {
        state.referenceChainId = action.payload.newChainId
        state = initialState(action.payload.newChainId)
      })
      // metadata fetch
      .addCase(fetchBondMeta.pending, state => {
        // state.metaLoaded = false;
      })
      .addCase(fetchBondMeta.fulfilled, (state, action) => {
        const { bondConfigWithIds, callBondConfigWithIds, callableBondConfigWithIds } = action.payload
        // vanilla
        for (let i = 0; i < bondConfigWithIds.length; i++) {
          const bond = bondConfigWithIds[i]
          state.bonds[action.meta.arg.chainId].bondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].bondData[bond.bondId], ...bond };
        }

        // call
        for (let i = 0; i < callBondConfigWithIds.length; i++) {
          const bond = callBondConfigWithIds[i]
          state.bonds[action.meta.arg.chainId].digitalBondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].digitalBondData[bond.bondId], ...bond };
        }

        // callables
        for (let i = 0; i < callableBondConfigWithIds.length; i++) {
          const bond = callableBondConfigWithIds[i]
          state.bonds[action.meta.arg.chainId].callableBondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].callableBondData[bond.bondId], ...bond };
        }

        state.metaLoaded = true;
      })
      .addCase(fetchBondMeta.rejected, (state, { error }) => {
        state.metaLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // public datafetch pair
      // VANILLA
      .addCase(calcSingleBondDetails.pending, state => {
        state.userDataLoading = true;
      })
      .addCase(calcSingleBondDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.bonds[action.meta.arg.chainId].bondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].bondData[bond.bondId], ...action.payload };
      })
      .addCase(calcSingleBondDetails.rejected, (state, { error }) => {
        console.log(error, state)
        console.error(error.message);
      })
      // CALL
      .addCase(calcSingleDigitalBondDetails.pending, state => {
        // state.userDataLoading = true;
      })
      .addCase(calcSingleDigitalBondDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.bonds[action.meta.arg.chainId].digitalBondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].digitalBondData[bond.bondId], ...action.payload };
      })
      .addCase(calcSingleDigitalBondDetails.rejected, (state, { error }) => {
        console.log(error, state)
        console.error(error.message);
      })
      // CALL
      .addCase(calcSingleCallableBondDetails.pending, state => {
        // state.userDataLoading = true;
      })
      .addCase(calcSingleCallableBondDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.bonds[action.meta.arg.chainId].callableBondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].callableBondData[bond.bondId], ...action.payload };
      })
      .addCase(calcSingleCallableBondDetails.rejected, (state, { error }) => {
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
        state.bonds[action.meta.arg.chainId].bondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].bondData[bond.bondId], ...action.payload };
      })
      .addCase(calcSingleBondStableLpDetails.rejected, (state, action) => {
        if (state.bonds[action.meta.arg.chainId].bondData[action.meta.arg.bond.bondId]?.publicLoaded)
          state.bonds[action.meta.arg.chainId].bondData[action.meta.arg.bond.bondId].publicLoaded = true
        console.log(action.error, state)
        console.error(action.error.message);
      })
      // Call Bond
      // detail fetch for stable pool (and currently weighted pool)
      .addCase(calcSingleDigitalBondPoolDetails.pending, state => {
        // state.userDataLoaded = false;
      })
      .addCase(calcSingleDigitalBondPoolDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.bonds[action.meta.arg.chainId].digitalBondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].digitalBondData[bond.bondId], ...action.payload };
      })
      .addCase(calcSingleDigitalBondPoolDetails.rejected, (state, action) => {
        if (state.bonds[action.meta.arg.chainId].digitalBondData[action.meta.arg.bond.bondId]?.publicLoaded)
          state.bonds[action.meta.arg.chainId].digitalBondData[action.meta.arg.bond.bondId].publicLoaded = true
        console.log(action.error, state)
        console.error(action.error.message)
      })
      // Callable Bond
      // detail fetch for stable pool (and currently weighted pool)
      .addCase(calcSingleCallableBondPoolDetails.pending, state => {
        // state.userDataLoaded = false;
      })
      .addCase(calcSingleCallableBondPoolDetails.fulfilled, (state, action) => {
        const bond = action.payload
        state.bonds[action.meta.arg.chainId].callableBondData[bond.bondId] = { ...state.bonds[action.meta.arg.chainId].callableBondData[bond.bondId], ...action.payload };
      })
      .addCase(calcSingleCallableBondPoolDetails.rejected, (state, action) => {
        if (state.bonds[action.meta.arg.chainId].callableBondData[action.meta.arg.bond.bondId]?.publicLoaded)
          state.bonds[action.meta.arg.chainId].callableBondData[action.meta.arg.bond.bondId].publicLoaded = true
        console.log(action.error, state)
        console.error(action.error.message)
      })
      // Update bonds with user data
      .addCase(fetchBondUserDataAsync.fulfilled, (state, action) => {
        const bondData = action.payload.dataAssignedToBonds
        Object.keys(bondData.bondUserData).forEach((bondId) => {
          state.bonds[action.meta.arg.chainId].bondData[bondId].userData = { ...state.bonds[action.meta.arg.chainId].bondData[bondId].userData, ...bondData.bondUserData[bondId] }
        })
        state.closedNotes[action.meta.arg.chainId].vanillaNotesClosed = action.payload.closedNotes
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
          state.bonds[action.meta.arg.chainId].digitalBondData[bondId].userData = { ...state.bonds[action.meta.arg.chainId].digitalBondData[bondId].userData, ...callBondData.bondUserData[bondId] }
        })
        state.closedNotes[action.meta.arg.chainId].digitalNotesClosed = action.payload.closedNotes
        state.userRewardDigital = callBondData.rewards
        state.userDigitalDataLoaded = true
      }).addCase(fetchCallBondUserDataAsync.pending, state => {
        state.userDigitalDataLoading = true;
      }).addCase(fetchCallBondUserDataAsync.rejected, (state, { error }) => {
        state.userDigitalDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // Update callable bonds with user data
      .addCase(fetchCallableBondUserDataAsync.fulfilled, (state, action) => {
        const callableBondData = action.payload.dataAssignedToBonds
        Object.keys(callableBondData.bondUserData).forEach((bondId) => {
          state.bonds[action.meta.arg.chainId].callableBondData[bondId].userData = { ...state.bonds[action.meta.arg.chainId].callableBondData[bondId].userData, ...callableBondData.bondUserData[bondId] }
        })
        state.closedNotes[action.meta.arg.chainId].callableNotesClosed = action.payload.closedNotes
        state.userRewardCallable = callableBondData.rewards
        state.userCallableDataLoaded = true
      }).addCase(fetchCallableBondUserDataAsync.pending, state => {
        // state.userCallableDataLoading = true;
      }).addCase(fetchCallableBondUserDataAsync.rejected, (state, { error }) => {
        state.userCallableDataLoaded = true;
        console.log(error, state)
        console.error(error.message);
      })
      // get Closed Markets
      .addCase(fetchClosedBondsUserAsync.fulfilled, (state, action) => {
        if (action.meta.arg.bIds.length > 0) {
          state.bondsClosed[action.meta.arg.chainId].vanillaBondsClosed = action.payload.vanillaMarkets
        }
        if (action.meta.arg.bIdsC.length > 0) {
          state.bondsClosed[action.meta.arg.chainId].callBondsClosed = action.payload.callMarkets
        }
        if (action.meta.arg.bIdsCallable.length > 0) {
          state.bondsClosed[action.meta.arg.chainId].callableBondsClosed = action.payload.callableMarkets
        }
        state.closedMarketsLoaded = true
      })
      .addCase(fetchClosedBondsUserAsync.pending, state => {
        // 
      })
      .addCase(fetchClosedBondsUserAsync.rejected, (state, { error }) => {
        state.closedMarketsLoaded = true
        console.log(error, state)
        console.error(error.message);
      })
      // setters for prices calculated with pools and links
      .addCase(setLpPrice, (state, action) => {
        if (action.payload.bondType === BondType.Vanilla) {
          state.bonds[action.payload.chainId].bondData[action.payload.bondId].purchasedInQuote = action.payload.price
        }
        if (action.payload.bondType === BondType.Call) {
          state.bonds[action.payload.chainId].digitalBondData[action.payload.bondId].purchasedInQuote = action.payload.price
        }
        if (action.payload.bondType === BondType.Callable) {
          state.bonds[action.payload.chainId].callableBondData[action.payload.bondId].purchasedInQuote = action.payload.price
        }
      })
      .addCase(setLpLink, (state, action) => {
        if (action.payload.bondType === BondType.Vanilla) {
          state.bonds[action.payload.chainId].bondData[action.payload.bondId].lpLink = action.payload.link
        }

        if (action.payload.bondType === BondType.Call) {
          state.bonds[action.payload.chainId].digitalBondData[action.payload.bondId].lpLink = action.payload.link
        }

        if (action.payload.bondType === BondType.Callable) {
          state.bonds[action.payload.chainId].callableBondData[action.payload.bondId].lpLink = action.payload.link
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
