/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import isArchivedBondId from 'utils/bondHelpers'
import { bonds as bondList, bondList as bondsDict } from 'config/constants/bonds'
import { BondConfig } from 'config/constants/types'
import { getContractForBond, getContractForReserve, getBondCalculatorContract, getWeightedPairContract } from 'utils/contractHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import multicall from 'utils/multicall';
import { getAddressForBond } from 'utils/addressHelpers';
import bondReserveAVAX from 'config/abi/avax/RequiemQBondDepository.json'
import fetchBonds from './fetchBonds'
import {
  fetchBondUserAllowances,
  fetchBondUserAllowancesAndBalances,
  fetchBondUserPendingPayoutData,
  fetchBondUserTokenBalances
} from './fetchBondUser'
import fetchPublicBondData from './fetchPublicBondData';
import { ICalcBondDetailsAsyncThunk, ICalcUserBondDetailsAsyncThunk } from './bondTypes';
import { bnParser, calcSingleBondDetails } from './calcSingleBondDetails';
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
      bondMaturationBlock: 0
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

// Async thunks
export const fetchBondsPublicDataAsync = createAsyncThunk(
  'bonds/fetchBondsPublicDataAsync',
  async (bondIds) => {
    // const { chainId } = useWeb3React()

    const chainId = 43113
    // const bondsToFetch = bondsDict[chainId].filter((bondConfig) => bondIds.includes(bondConfig.bondId))

    // Add price helper bonds
    // const bondsWithPriceHelpers = bondsToFetch
    const bonds = await fetchBonds(chainId, bondsDict)
    console.log("bonds", bonds)
    const bondWithPublicData = await fetchPublicBondData(chainId, bonds[bondIds])
    // const bondsWithPrices = await fetchBondsPrices(chainId, bonds)

    return bondWithPublicData
  }
)

interface BondUserDataResponse {
  bondId: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  pendingPayout: string,
  interestDue: string,
  balance: string
  bondMaturationBlock: number
}



export const fetchBondUserDataAsync = createAsyncThunk<BondUserDataResponse[], { chainId: number, account: string; bondIds: number[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ chainId, account, bondIds }) => {

    const bondsToFetch = bondList(chainId).filter((bondConfig) => bondIds.includes(bondConfig.bondId))

    const {
      allowances: userBondAllowances,
      balances: userBondTokenBalances
    } = await fetchBondUserAllowancesAndBalances(chainId, account, bondsToFetch)

    const {
      pendingPayout,
      bondInfo
    } = await fetchBondUserPendingPayoutData(chainId, account, bondsToFetch)

    const interestDue = bondInfo.map((info) => {
      return info.payout.toString();
    })

    const bondMaturationBlock = bondInfo.map((info) => {
      return info.vesting.add(info.lastBlock).toString();
    })
    
    return userBondAllowances.map((_, index) => {
      return {
        bondId: bondIds[index],
        allowance: userBondAllowances[index],
        tokenBalance: userBondTokenBalances[index], //  userBondTokenBalances[index],
        stakedBalance: 0, // userStakedBalances[index],
        earnings: 0, //  userBondEarnings[index],
        pendingPayout: pendingPayout[index],
        interestDue: interestDue[index],
        balance: userBondTokenBalances[index],
        bondMaturationBlock: bondMaturationBlock[index]
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
      // .addCase(fetchBondsPublicDataAsync.fulfilled, (state, action) => {
      //   state.data = state.data.map((bond) => {
      //     console.log("baba", action.payload)
      //     const liveBondData = action.payload // .find((bondData) => bondData.bondId === bond.bondId)
      //     return { ...bond, ...liveBondData }
      //   })
      // })
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

// TODO (appleseed): improve this logic
const getBondReservePrice = async (chainId: number, isLP: boolean, provider: any) => {
  let marketPrice: number;
  if (isLP) {
    const pairContract = getContractForReserve(chainId, provider);
    const reserves = await pairContract.getReserves();
    marketPrice = Number(reserves[1].toString()) / Number(reserves[0].toString()) / 10 ** 9;
  } else {
    marketPrice = 16 // await getTokenPrice("convex-finance");
  }
  return marketPrice;
}


// Actions
export const { setLoadArchivedBondsData } = bondsSlice.actions

export default bondsSlice.reducer
