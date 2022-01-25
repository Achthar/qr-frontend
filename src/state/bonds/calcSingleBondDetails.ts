/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { useMemo } from 'react';
import { deserializeToken } from 'state/user/hooks/helpers';
import { getContractForBond, getContractForLpReserve } from 'utils/contractHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
import { addresses } from 'config/constants/contracts';
import multicall from 'utils/multicall';
import bondReserveAVAX from 'config/abi/avax/RequiemQBondDepository.json'
import weightedPair from 'config/abi/avax/RequiemWeightedPair.json'
import { Fraction, JSBI, WeightedPair } from '@requiemswap/sdk';
import { ICalcBondDetailsAsyncThunk, ICalcUserBondDetailsAsyncThunk } from './bondTypes';
import { loadMarketPrice, priceFromData } from './loadMarketPrice';
import { BondsState, Bond } from '../types'

const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')

export function bnParser(bn: BigNumber, decNr: BigNumber) {
  return Number((new Fraction(JSBI.BigInt(bn.toString()), JSBI.BigInt(decNr.toString()))).toSignificant(18))
}

export const calcSingleBondDetails = createAsyncThunk(
  "bonds/calcBondDetails",
  async ({ bond, provider, chainId }: ICalcBondDetailsAsyncThunk, { dispatch }): Promise<Bond> => {

    let bondQuote: BigNumberish = BigNumber.from(0);
    const bondContract = getContractForBond(chainId, provider);
    const reserveContract = getContractForLpReserve(chainId, provider)

    // cals for general bond data
    const calls = [
      // max payout
      {
        address: bondContract.address,
        name: 'maxPayout'
      },
      // debt ratio
      {
        address: bondContract.address,
        name: bond.name === 'cvx' ? 'debtRatio' : 'standardizedDebtRatio',
      },
      // terms
      {
        address: bondContract.address,
        name: 'terms',
      },
      // bond price in USD
      {
        address: bondContract.address,
        name: 'bondPriceInUSD',
      },
    ]

    const [maxBondPrice, debtRatio, terms, bondPrice] =
      await multicall(chainId, bondReserveAVAX, calls)

    // calls from pair used for pricing
    const callsPair = [
      // max payout
      {
        address: reserveContract.address,
        name: 'getReserves'
      },
      // debt ratio
      {
        address: reserveContract.address,
        name: 'totalSupply',
      },
      {
        address: reserveContract.address,
        name: 'balanceOf',
        params: [getAddress(addresses.treasury[chainId])]
      },
    ]

    const [reserves, supply, purchasedQuery] =
      await multicall(chainId, weightedPair, callsPair)


    // calculate price
    const price = bond.token && bond.quoteToken ? priceFromData(
      deserializeToken(bond.token),
      deserializeToken(bond.quoteToken),
      BigNumber.from(bond.lpProperties.weightToken),
      BigNumber.from(bond.lpProperties.weightQuoteToken),
      reserves[0],
      reserves[1],
      JSBI.BigInt(bond.lpProperties.fee)
    ) : '0'

    const marketPrice = BigNumber.from(price)

    // that has to be updated / included in multicall in the future
    if (bond.isLP) {
      // valuation = Number(
      //   (await bondCalcContract.valuation(getAddressForReserve(chainId) || "", amountInWei)).toString(),
      // );
      bondQuote = BigNumber.from(100) // await bondContract.payoutFor(valuation))

      bondQuote = bnParser(bondQuote, E_NINE)
    } else {
      // RFV = DAI
      bondQuote = BigNumber.from(3245) // await bondContract.payoutFor(amountInWei);

      bondQuote = bnParser(bondQuote, E_EIGHTEEN)

    }

    const purchased = bnParser(purchasedQuery[0], E_EIGHTEEN)
    const bondDiscount = bnParser(marketPrice.sub(bondPrice.price_), bondPrice.price_)

    return {
      ...bond,
      bondDiscount,
      debtRatio: debtRatio[0].toString(),
      bondQuote: Number(bondQuote.toString()),
      purchased,
      lpData: {
        lpTotalSupply: supply[0]?.toString(),
        reserve0: reserves[0]?.toString(),
        reserve1: reserves[1]?.toString()
      },
      bondTerms: {
        controlVariable: terms.controlVariable.toString(), // scaling variable for price
        vestingTerm: terms.vestingTerm.toString(), // in blocks
        minimumPrice: terms.minimumPrice.toString(), // vs principle value
        maxPayout: terms.maxPayout.toString(), // in thousandths of a %. i.e. 500 = 0.5%
        fee: terms.fee.toString(), // as % of bond payout, in hundreths. ( 500 = 5% = 0.05 for every 1 paid)
        maxDebt: terms.maxDebt.toString(),
      },
      vestingTerm: Number(terms.vestingTerm.toString()),
      maxBondPrice: bnParser(maxBondPrice[0], E_NINE), // maxBondPrice.div(E_NINE).toNumber(),
      bondPrice: bnParser(bondPrice.price_, E_EIGHTEEN), // bondPrice.div(E_EIGHTEEN).toNumber(),
      marketPrice: marketPrice.toString(),
    };
  },
);