/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import { useNetworkState } from 'state/globalNetwork/hooks'

import { getContractForBond, getContractForReserve, getBondCalculatorContract, getWeightedPairContract, getContractForLpReserve } from 'utils/contractHelpers';
import { getAddressForBond, getAddressForReserve } from 'utils/addressHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
// import { useAppDispatch, useAppSelector } from 'state'
import { addresses } from 'config/constants/contracts';
import { Fraction, JSBI } from '@requiemswap/sdk';
import { ICalcBondDetailsAsyncThunk, ICalcUserBondDetailsAsyncThunk } from './bondTypes';
import { loadMarketPrice } from './loadMarketPrice';
import { BondsState, Bond } from '../types'

const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')

function bnParser(bn: BigNumber, decNr: BigNumber) {
  return Number((new Fraction(JSBI.BigInt(bn.toString()), JSBI.BigInt(decNr.toString()))).toSignificant(18))
}

export const calcSingleBondDetails = createAsyncThunk(
  "bonds/calcBondDetails",
  async ({ bond, value, provider, chainId }: ICalcBondDetailsAsyncThunk, { dispatch }): Promise<Bond> => {
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
    let debtRatio: BigNumber;
    // TODO (appleseed): improve this logic
    if (bond.name === "cvx") {
      debtRatio = await bondContract.debtRatio();
    } else {
      debtRatio = await bondContract.standardizedDebtRatio();
    }
    debtRatio = debtRatio.div(E_NINE)  // / (10 ** 9);

    let marketPrice: BigNumber;
    try {
      const originalPromiseResult = await dispatch(
        loadMarketPrice({ chainId, provider }),
      ).unwrap();
      marketPrice = BigNumber.from(originalPromiseResult.marketPrice)
      console.log("MP DISPAtCH", originalPromiseResult)
    } catch (rejectedValueOrSerializedError) {
      // handle error here
      console.error("Returned a null response from dispatch(loadMarketPrice)");
    }

    try {
      // TODO (appleseed): improve this logic
      if (bond.name === "cvx") {
        const bondPriceRaw = await bondContract.bondPrice();
        console.log("BPRAW", bondPriceRaw)
        const assetPriceUSD = 213 // await bond.getBondReservePrice(chainId, provider);
        const assetPriceBN = ethers.utils.parseUnits(assetPriceUSD.toString(), 14);
        // bondPriceRaw has 4 extra decimals, so add 14 to assetPrice, for 18 total
        bondPrice = bondPriceRaw.mul(assetPriceBN);
      } else {
        console.log("PRICE CALC")
        bondPrice = await bondContract.bondPriceInUSD();
        console.log("BPRAW", bondPrice)
      }
      bondDiscount = Number(marketPrice.mul(E_EIGHTEEN)
        .sub(bondPrice).div(bondPrice).toString()) // marketPrice && bondPrice
      // ?  : 0 // (marketPrice * (10 ** 18) - Number(bondPrice.toString())) / Number(bondPrice.toString()); // 1 - bondPrice / (bondPrice * (10 ** 9));
      console.log("BDISCOUNT", marketPrice.toString(), bondPrice.toString(), bondDiscount)
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
      bondQuote = BigNumber.from(await bondContract.payoutFor(valuation))

      if (!amountInWei.isZero() && Number(bondQuote.toString()) < 100000) {
        bondQuote = BigNumber.from(0);
        const errorString = "Amount is too small!";
        // dispatch(error(errorString));
      } else {
        bondQuote = bnParser(bondQuote, E_NINE) //  / (10 ** 9);
      }
    } else {
      // RFV = DAI
      bondQuote = BigNumber.from(3245) // await bondContract.payoutFor(amountInWei);

      if (!amountInWei.isZero() && Number(bondQuote.toString()) < 100000000000000) {
        bondQuote = BigNumber.from(0);
        const errorString = "Amount is too small!";
        // dispatch(error(errorString));
      } else {
        bondQuote = bnParser(bondQuote, E_EIGHTEEN) // / (10 ** 18);
      }
    }

    // Display error if user tries to exceed maximum.
    if (!!value && parseFloat(bondQuote.toString()) > bnParser(maxBondPrice, E_NINE)) {
      const errorString =
        `You're trying to bond more than the maximum payout available! The maximum bond payout is ${bnParser(maxBondPrice, E_NINE).toFixed(2).toString()
        } REQT.`;
      console.log(errorString)
      // dispatch(error(errorString));
    }
    console.log("AM")
    // Calculate bonds purchased
    const reserveContract = getContractForLpReserve(chainId, provider)
    // console.log("CONTRACT", reserveContract, "ARG", getAddress(addresses.treasury[chainId]))
    const purchasedQuery = await reserveContract.balanceOf(getAddress(addresses.treasury[chainId])) // 213432 // await bond.getTreasuryBalance(chainId, provider);
    // console.log("PQUERY", purchasedQuery)
    const purchased = bnParser(purchasedQuery, E_EIGHTEEN) // Number(purchasedQuery.toString()) / (10 ** 18);

    console.log("RESULTS BOND FETCH",
      bond.name,
      bondDiscount,
      Number(debtRatio.toString()),
      Number(bondQuote.toString()),
      "purchjased",
      purchased,
      Number(terms.vestingTerm.toString()),
      // Number(maxBondPrice.toString()) / (10 ** 9),
      // Number(bondPrice.toString()) / (10 ** 18),
      marketPrice)

    return {
      ...bond,
      bondDiscount,
      debtRatio: Number(debtRatio.toString()),
      bondQuote: Number(bondQuote.toString()),
      purchased,
      vestingTerm: Number(terms.vestingTerm.toString()),
      maxBondPrice: bnParser(maxBondPrice, E_NINE), // maxBondPrice.div(E_NINE).toNumber(),
      bondPrice: bnParser(bondPrice, E_EIGHTEEN), // bondPrice.div(E_EIGHTEEN).toNumber(),
      marketPrice: marketPrice.toString(),
    };
  },
);