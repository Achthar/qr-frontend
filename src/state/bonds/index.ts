/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import { useNetworkState } from 'state/globalNetwork/hooks'
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { ChainId } from '@requiemswap/sdk'
import { useWeb3React } from '@web3-react/core'
import isArchivedBondId from 'utils/bondHelpers'
import { bondList as bondsDict } from 'config/constants/bonds'
import priceHelperLpsConfig from 'config/constants/priceHelperLps'
import { BondConfig } from 'config/constants/types'
import { getContractForBond, getContractForReserve, getBondCalculatorContract } from 'utils/contractHelpers';
import { getAddressForBond, getAddressForReserve } from 'utils/addressHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
// import { useAppDispatch, useAppSelector } from 'state'
import fetchBonds from './fetchBonds'
import fetchBondsPrices from './fetchBondPrices'
import {
  fetchBondUserEarnings,
  fetchBondUserAllowances,
  fetchBondUserTokenBalances,
  fetchBondUserStakedBalances,
} from './fetchBondUser'
import { BondsState, Bond } from '../types'

// import { chain } from 'lodash'

const chainIdFromState = 43113 // useAppSelector((state) => state.application.chainId)

function noAccountBondConfig(chainId: number) {
  return bondsDict[chainId].map((bond) => ({
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
    userDataLoaded: false
  }
}

export function nonArchivedBonds(chainId: number): BondConfig[] { return bondsDict[chainId ?? 43113].filter(({ bondId }) => !isArchivedBondId(bondId)) }

// Async thunks
export const fetchBondsPublicDataAsync = createAsyncThunk<Bond[], number[]>(
  'bonds/fetchBondsPublicDataAsync',
  async (bondIds) => {
    const { chainId } = useWeb3React()
    // const bondsToFetch = bondsDict[chainId].filter((bondConfig) => bondIds.includes(bondConfig.bondId))

    // Add price helper bonds
    // const bondsWithPriceHelpers = bondsToFetch
    const bonds = await fetchBonds(chainId, bondsDict)
    console.log("bonds", bonds)
    const bondsWithPrices = await fetchBondsPrices(chainId, bonds)


    return bondsWithPrices
  },
)

interface BondUserDataResponse {
  bondId: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
}

export interface IBondDetails {
  bond: string;
  bondDiscount: number;
  debtRatio: number;
  bondQuote: number;
  purchased: number;
  vestingTerm: number;
  maxBondPrice: number;
  bondPrice: number;
  marketPrice: number;
}


export interface IJsonRPCError {
  readonly message: string;
  readonly code: number;
}

export interface IBaseAsyncThunk {
  readonly chainId: ChainId;
  readonly provider: StaticJsonRpcProvider | JsonRpcProvider;
}

export interface IChangeApprovalAsyncThunk extends IBaseAsyncThunk {
  readonly token: string;
  readonly address: string;
}

export interface IChangeApprovalWithDisplayNameAsyncThunk extends IChangeApprovalAsyncThunk {
  readonly displayName: string;
}

export interface IActionAsyncThunk extends IBaseAsyncThunk {
  readonly action: string;
  readonly address: string;
}

export interface IValueAsyncThunk extends IBaseAsyncThunk {
  readonly value: string;
  readonly address: string;
}

export interface IActionValueAsyncThunk extends IValueAsyncThunk {
  readonly action: string;
}

export interface IActionValueGasAsyncThunk extends IActionValueAsyncThunk {
  readonly gas: number;
}

export interface IBaseAddressAsyncThunk extends IBaseAsyncThunk {
  readonly address: string;
}

export interface IZapAsyncThunk extends IBaseAddressAsyncThunk {
  readonly tokenAddress: string;
  readonly sellAmount: number;
  readonly slippage: string;
}

// Account Slice

export interface ICalcUserBondDetailsAsyncThunk extends IBaseAddressAsyncThunk, IBaseBondAsyncThunk { }

// Bond Slice

export interface IBaseBondAsyncThunk extends IBaseAsyncThunk {
  readonly bond: Bond;
}

export interface IApproveBondAsyncThunk extends IBaseBondAsyncThunk {
  readonly address: string;
}

export interface ICalcBondDetailsAsyncThunk extends IBaseBondAsyncThunk {
  readonly value: string;
}

export interface IBondAssetAsyncThunk extends IBaseBondAsyncThunk, IValueAsyncThunk {
  readonly slippage: number;
}

export interface IRedeemBondAsyncThunk extends IBaseBondAsyncThunk {
  readonly address: string;
  readonly autostake: boolean;
}

export interface IRedeemAllBondsAsyncThunk extends IBaseAsyncThunk {
  readonly bonds: Bond[];
  readonly address: string;
  readonly autostake: boolean;
}


/**
 * - fetches the REQT price from CoinGecko (via getTokenPrice)
 * - falls back to fetch marketPrice from ohm-dai contract
 * - updates the App.slice when it runs
 */
const loadMarketPrice = createAsyncThunk("bond/loadMarketPrice", async ({ chainId, provider }: IBaseAsyncThunk) => {
  let marketPrice: number;
  try {
    // only get marketPrice from eth mainnet
    marketPrice = 41432// await getMarketPrice({ chainId, provider });
    // let mainnetProvider = (marketPrice = await getMarketPrice({ 1: NetworkID, provider }));
    marketPrice /= 10 ** 9;
  } catch (e) {
    marketPrice = 3222 // await getTokenPrice("olympus");
  }
  return { marketPrice };
});

export const findOrLoadMarketPrice = createAsyncThunk(
  "bond/findOrLoadMarketPrice",
  async ({ chainId, provider }: IBaseAsyncThunk, { dispatch, getState }) => {
    const state: any = getState();
    let marketPrice;
    // check if we already have loaded market price
    if (state.app.loadingMarketPrice === false && state.app.marketPrice) {
      // go get marketPrice from app.state
      marketPrice = state.app.marketPrice;
    } else {
      // we don't have marketPrice in app.state, so go get it
      try {
        const originalPromiseResult = await dispatch(
          loadMarketPrice({ chainId, provider }),
        ).unwrap();
        marketPrice = originalPromiseResult?.marketPrice;
      } catch (rejectedValueOrSerializedError) {
        // handle error here
        console.error("Returned a null response from dispatch(loadMarketPrice)");
        return {};
      }
    }
    return { marketPrice };
  },
);


export const calcBondDetails = createAsyncThunk(
  "bonds/calcBondDetails",
  async ({ bond, value, provider, chainId }: ICalcBondDetailsAsyncThunk, { dispatch }): Promise<IBondDetails> => {
    if (!value || value === "") {
      value = "0";
    }
    const amountInWei = ethers.utils.parseEther(value);

    let bondPrice = BigNumber.from(0);
    let bondDiscount = 0;
    let valuation = 0;
    let bondQuote: BigNumberish = BigNumber.from(0);
    const bondContract = getContractForBond(chainId, provider);
    const bondCalcContract = getBondCalculatorContract(chainId, provider);

    const terms = await bondContract.terms();
    const maxBondPrice = await bondContract.maxPayout();
    let debtRatio: BigNumberish;
    // TODO (appleseed): improve this logic
    if (bond.name === "cvx") {
      debtRatio = await bondContract.debtRatio();
    } else {
      debtRatio = await bondContract.standardizedDebtRatio();
    }
    debtRatio = Number(debtRatio.toString()) / (10 ** 9);

    let marketPrice: number;
    try {
      const originalPromiseResult = await dispatch(
        findOrLoadMarketPrice({ chainId, provider }),
      ).unwrap();
      marketPrice = originalPromiseResult?.marketPrice;
    } catch (rejectedValueOrSerializedError) {
      // handle error here
      console.error("Returned a null response from dispatch(loadMarketPrice)");
    }

    try {
      // TODO (appleseed): improve this logic
      if (bond.name === "cvx") {
        const bondPriceRaw = await bondContract.bondPrice();
        const assetPriceUSD = 213 // await bond.getBondReservePrice(chainId, provider);
        const assetPriceBN = ethers.utils.parseUnits(assetPriceUSD.toString(), 14);
        // bondPriceRaw has 4 extra decimals, so add 14 to assetPrice, for 18 total
        bondPrice = bondPriceRaw.mul(assetPriceBN);
      } else {
        bondPrice = await bondContract.bondPriceInUSD();
      }
      bondDiscount = (marketPrice * (10 ** 18) - Number(bondPrice.toString())) / Number(bondPrice.toString()); // 1 - bondPrice / (bondPrice * (10 ** 9));
    } catch (e) {
      console.log("error getting bondPriceInUSD", bond.name, e);
    }

    if (Number(value) === 0) {
      // if inputValue is 0 avoid the bondQuote calls
      bondQuote = BigNumber.from(0);
    } else if (bond.isLP) {
      valuation = Number(
        (await bondCalcContract.valuation(getAddressForReserve(chainId) || "", amountInWei)).toString(),
      );
      bondQuote = await bondContract.payoutFor(valuation);
      if (!amountInWei.isZero() && Number(bondQuote.toString()) < 100000) {
        bondQuote = BigNumber.from(0);
        const errorString = "Amount is too small!";
        // dispatch(error(errorString));
      } else {
        bondQuote = Number(bondQuote.toString()) / (10 ** 9);
      }
    } else {
      // RFV = DAI
      bondQuote = await bondContract.payoutFor(amountInWei);

      if (!amountInWei.isZero() && Number(bondQuote.toString()) < 100000000000000) {
        bondQuote = BigNumber.from(0);
        const errorString = "Amount is too small!";
        // dispatch(error(errorString));
      } else {
        bondQuote = Number(bondQuote.toString()) / (10 ** 18);
      }
    }

    // Display error if user tries to exceed maximum.
    if (!!value && parseFloat(bondQuote.toString()) > Number(maxBondPrice.toString()) / (10 ** 9)) {
      const errorString =
        `You're trying to bond more than the maximum payout available! The maximum bond payout is ${(Number(maxBondPrice.toString()) / (10 ** 9)).toFixed(2).toString()
        } REQT.`;
      // dispatch(error(errorString));
    }

    // Calculate bonds purchased
    const purchased = 213432 // await bond.getTreasuryBalance(chainId, provider);

    return {
      bond: bond.name,
      bondDiscount,
      debtRatio: Number(debtRatio.toString()),
      bondQuote: Number(bondQuote.toString()),
      purchased,
      vestingTerm: Number(terms.vestingTerm.toString()),
      maxBondPrice: Number(maxBondPrice.toString()) / (10 ** 9),
      bondPrice: Number(bondPrice.toString()) / (10 ** 18),
      marketPrice,
    };
  },
);

export const fetchBondUserDataAsync = createAsyncThunk<BondUserDataResponse[], { account: string; bondIds: number[] }>(
  'bonds/fetchBondUserDataAsync',
  async ({ account, bondIds }) => {
    const { chainId } = useWeb3React()
    const bondsToFetch = bondsDict[chainId].filter((bondConfig) => bondIds.includes(bondConfig.bondId))
    const userBondAllowances = await fetchBondUserAllowances(chainId, account, bondsToFetch)
    const userBondTokenBalances = await fetchBondUserTokenBalances(chainId, account, bondsToFetch)
    const userStakedBalances = await fetchBondUserStakedBalances(chainId, account, bondsToFetch)
    const userBondEarnings = await fetchBondUserEarnings(chainId, account, bondsToFetch)
    console.log("bTF", bondsToFetch)
    return userBondAllowances.map((bondAllowance, index) => {
      return {
        bondId: bondsToFetch[index].bondId,
        allowance: userBondAllowances[index],
        tokenBalance: userBondTokenBalances[index],
        stakedBalance: userStakedBalances[index],
        earnings: userBondEarnings[index],
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
  },
  extraReducers: (builder) => {
    // Update bonds with live data
    builder.addCase(fetchBondsPublicDataAsync.fulfilled, (state, action) => {
      state.data = state.data.map((bond) => {
        console.log("baba", action.payload)
        const liveBondData = action.payload.find((bondData) => bondData.bondId === bond.bondId)
        return { ...bond, ...liveBondData }
      })
    })
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
      })

    // Update bonds with user data
    builder.addCase(fetchBondUserDataAsync.fulfilled, (state, action) => {
      action.payload.forEach((userDataEl) => {
        const { bondId } = userDataEl
        const index = state.data.findIndex((bond) => bond.bondId === bondId)
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

// Actions
export const { setLoadArchivedBondsData } = bondsSlice.actions

export default bondsSlice.reducer
