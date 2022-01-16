/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import { useNetworkState } from 'state/globalNetwork/hooks'
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { ChainId, JSBI, Price, TokenAmount, WeightedPair } from '@requiemswap/sdk'
import { useWeb3React } from '@web3-react/core'
// import { useReqtPrice } from 'hooks/usePrice';
import isArchivedBondId from 'utils/bondHelpers'
import { DAI, REQT } from 'config/constants/tokens';
import { bonds as bondList, bondList as bondsDict } from 'config/constants/bonds'
import { BondConfig } from 'config/constants/types'
import { getContractForBond, getContractForReserve, getBondCalculatorContract, getWeightedPairContract } from 'utils/contractHelpers';
import { getAddressForBond, getAddressForReserve } from 'utils/addressHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
// import { useAppDispatch, useAppSelector } from 'state'
import { addresses } from 'config/constants/contracts';
import fetchBonds from './fetchBonds'
import fetchBondsPrices from './fetchBondPrices'
// import { usePriceReqtUsd } from './hooks';
import {
  // fetchBondUserEarnings,
  fetchBondUserAllowances,
  fetchBondUserTokenBalances,
  fetchBondUserStakedBalances,
} from './fetchBondUser'
import fetchPublicBondData from './fetchPublicBondData';
import { ICalcBondDetailsAsyncThunk, ICalcUserBondDetailsAsyncThunk } from './bondTypes';
import { calcSingleBondDetails } from './calcSingleBondDetails';
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
    },
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
    const { chainId } = useWeb3React()
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
}



export const fetchBondUserDataAsync = createAsyncThunk<BondUserDataResponse[], { chainId: number, account: string; bondIds: number[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ chainId, account, bondIds }) => {
    // const { chainId } = useWeb3React()
    // const chainId = 43113
    const bondsToFetch = bondList(chainId) // bondsDict[chainId] // .filter((bondConfig) => bondIds.includes(bondConfig.bondId))
    const userBondAllowances = await fetchBondUserAllowances(chainId, account, bondsToFetch)
    // const userBondTokenBalances = await fetchBondUserTokenBalances(chainId, account, bondsToFetch)
    // const userStakedBalances = await fetchBondUserStakedBalances(chainId, account, bondsToFetch)
    // const userBondEarnings = await fetchBondUserEarnings(chainId, account, bondsToFetch)
    console.log("bTF", bondsToFetch)
    return userBondAllowances.map((bondAllowance, index) => {
      return {
        bondId: bondsToFetch[index].bondId,
        allowance: userBondAllowances[index],
        tokenBalance: 0, //  userBondTokenBalances[index],
        stakedBalance: 0, // userStakedBalances[index],
        earnings: 0 //  userBondEarnings[index],
      }
    })
  },
)

// Note(zx): this is a barebones interface for the state. Update to be more accurate
// interface IBondSlice {
//   status: string;
//   [key: string]: any;
// }

// const setBondState = (state: IBondSlice, payload: any) => {
//   const bond = payload.bond;
//   const newState = { ...state[bond], ...payload };
//   state[bond] = newState;
//   state.loading = false;
// };

// const initialState: IBondSlice = {
//   status: "idle",
// };


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
      .addCase(calculateUserBondDetails.pending, state => {
        state.userDataLoaded = false;
      })
      .addCase(calculateUserBondDetails.fulfilled, (state, action) => {
        if (!action.payload) return;
        const bond = action.payload.bond;
        state.data[bond] = action.payload;
        state.userDataLoaded = true;
      })
      .addCase(calculateUserBondDetails.rejected, (state, { error }) => {
        state.userDataLoaded = true;
        console.log(error);
      }).addCase(calcSingleBondDetails.pending, state => {
        state.userDataLoaded = false;
      })
      .addCase(calcSingleBondDetails.fulfilled, (state, action) => {
        // setBondState(state, action.payload);
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
          // const { bondId } = userDataEl
          const index = state.data.findIndex((bond) => bond.bondId === 0)
          state.data[index] = { ...state.data[index], userData: userDataEl }
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
export const calculateUserBondDetails = createAsyncThunk(
  "account/calculateUserBondDetails",
  async ({ address, bond, chainId, provider }: ICalcUserBondDetailsAsyncThunk) => {
    if (!address) {
      return {
        bond: "",
        displayName: "",
        bondIconSvg: "",
        isLP: false,
        allowance: 0,
        balance: "0",
        interestDue: 0,
        bondMaturationBlock: 0,
        pendingPayout: "",
      };
    }
    // dispatch(fetchBondInProgress());

    // Calculate bond details.
    const bondContract = getContractForBond(chainId, provider);
    const reserveContract = getContractForReserve(chainId, provider);

    const bondDetails = await bondContract.bondInfo(address);
    const interestDue: BigNumberish = Number(bondDetails.payout.toString()) / (10 ** 9);
    const bondMaturationBlock = +bondDetails.vesting + +bondDetails.lastBlock;
    const pendingPayout = await bondContract.pendingPayoutFor(address);

    let balance = BigNumber.from(0);
    const allowance = await reserveContract.allowance(address, getAddressForBond(chainId) || "");
    balance = await reserveContract.balanceOf(address);
    // formatEthers takes BigNumber => String
    const balanceVal = ethers.utils.formatEther(balance);
    // balanceVal should NOT be converted to a number. it loses decimal precision
    return {
      bond: bond.name,
      displayName: bond.displayName,
      bondIconSvg: bond.bondIconSvg,
      isLP: bond.isLP,
      allowance: Number(allowance.toString()),
      balance: balanceVal,
      interestDue,
      bondMaturationBlock,
      pendingPayout: ethers.utils.formatUnits(pendingPayout, "gwei"),
    };
  },
);

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
