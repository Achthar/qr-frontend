/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import { useNetworkState } from 'state/globalNetwork/hooks'

import { getContractForBond, getContractForLpReserve } from 'utils/contractHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
// import { useAppDispatch, useAppSelector } from 'state'
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

    let bondDiscount = 0;
    const valuation = 0;
    let bondQuote: BigNumberish = BigNumber.from(0);
    const bondContract = getContractForBond(chainId, provider);
    const reserveContract = getContractForLpReserve(chainId, provider)
    console.log("BC", bondContract)
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
    // const interval = setInterval(multicall, 5000);

    const [maxBondPrice, debtRatio, terms, bondPrice] =
      await multicall(chainId, bondReserveAVAX, calls)

    // console.log("RES", maxBondPrice, debtRatio, terms, bondPrice)

    let marketPrice: BigNumber;
    try {
      const originalPromiseResult = await dispatch(
        loadMarketPrice({ chainId, provider }),
      ).unwrap();
      marketPrice = BigNumber.from(originalPromiseResult.marketPrice)
    } catch (rejectedValueOrSerializedError) {
      // handle error here
      console.error("Returned a null response from dispatch(loadMarketPrice)");
    }

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

    console.log("RES1", reserves, supply)
    // const price = useMemo(
    //   () => {
    //     return priceFromData(
    //       deserializeToken(bond.token),
    //       deserializeToken(bond.quoteToken),
    //       BigNumber.from(80),
    //       BigNumber.from(20),
    //       reserves[0],
    //       reserves[1],
    //       JSBI.BigInt(25)
    //     )
    //   },
    //   [reserves, bond.token, bond.quoteToken]
    // )


    if (bond.isLP) {
      // valuation = Number(
      //   (await bondCalcContract.valuation(getAddressForReserve(chainId) || "", amountInWei)).toString(),
      // );
      bondQuote = BigNumber.from(100) // await bondContract.payoutFor(valuation))

      bondQuote = bnParser(bondQuote, E_NINE) //  / (10 ** 9);
    } else {
      // RFV = DAI
      bondQuote = BigNumber.from(3245) // await bondContract.payoutFor(amountInWei);

      bondQuote = bnParser(bondQuote, E_EIGHTEEN) // / (10 ** 18);

    }

    // Calculate bonds purchased

    console.log("CONTRACT", reserveContract, "ARG", getAddress(addresses.treasury[chainId]))
    // const purchasedQuery = await reserveContract.balanceOf(getAddress(addresses.treasury[chainId])) // 213432 // await bond.getTreasuryBalance(chainId, provider);
    console.log("CONTRACTEND")
    const purchased = bnParser(purchasedQuery[0], E_EIGHTEEN) // Number(purchasedQuery.toString()) / (10 ** 18);

    bondDiscount = bnParser(marketPrice.sub(bondPrice.price_), bondPrice.price_)
    console.log("DR", debtRatio)
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