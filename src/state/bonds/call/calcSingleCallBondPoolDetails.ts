/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { getContractForBondDepo, getContractForCallBondDepo, getContractForLpReserve } from 'utils/contractHelpers';
import { BigNumber } from 'ethers'
import { bnParser } from 'utils/helper';
import multicall from 'utils/multicall';
import { getAddress } from 'ethers/lib/utils';
import bondReserveAVAX from 'config/abi/avax/CallBondDepository.json'
import { ICalcCallBondDetailsAsyncThunk } from '../types';
import { CallBond } from '../../types'

const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export const calcSingleCallBondPoolDetails = createAsyncThunk(
  "bonds/calcSingleCallBondPoolDetails",
  async ({ bond, provider, chainId }: ICalcCallBondDetailsAsyncThunk): Promise<CallBond> => {

    const bondContract = getContractForCallBondDepo(chainId, provider);

    // cals for general bond data
    const calls = [
      // max payout
      {
        address: bondContract.address,
        name: 'markets',
        params: [bond.bondId]
      },
      // debt ratio
      {
        address: bondContract.address,
        name: 'debtRatio',
        params: [bond.bondId]
      },
      // terms
      {
        address: bondContract.address,
        name: 'terms',
        params: [bond.bondId]
      },
      // bond price in USD
      {
        address: bondContract.address,
        name: 'marketPrice',
        params: [bond.bondId]
      },
    ]

    const [market, debtRatio, terms, bondPrice] =
      await multicall(chainId, bondReserveAVAX, calls)

    const [reserves, supply] = [['0', '0'], '0']

    // calculate price
    const price = '0'

    const marketPrice = BigNumber.from(price)

    const bondDiscount = bnParser(marketPrice.sub(bondPrice[0]), bondPrice[0])

    return {
      ...bond,
      bondDiscount,
      debtRatio: debtRatio[0].toString(),
      lpData: {
        lpTotalSupply: supply?.[0]?.toString(),
        reserve0: reserves?.[0]?.toString(),
        reserve1: reserves?.[1]?.toString(),
        priceInQuote: price
      },
      bondTerms: {
        fixedTerm: Boolean(terms.fixedTerm.toString()),
        controlVariable: terms.controlVariable.toString(), // scaling variable for price
        vesting: terms.vesting.toString(), // in blocks
        maxDebt: terms.maxDebt.toString(),
        conclusion: terms.conclusion.toString(),
        thresholdPercentage: terms.thresholdPercentage.toString(),
        payoffPercentage: terms.payoffPercentage.toString()
      },
      market: {
        underlying: getAddress(market.underlying),
        capacity: market.capacity.toString(),
        capacityInQuote: Boolean(market.capacityInQuote.toString()),
        totalDebt: market.totalDebt.toString(),
        maxPayout: market.maxPayout.toString(),
        sold: market.sold.toString(),
        purchased: market.purchased.toString(),
      },
      vestingTerm: Number(terms.vesting.toString()),
      bondPrice: bnParser(bondPrice[0], E_EIGHTEEN), // bondPrice.div(E_EIGHTEEN).toNumber(),
      marketPrice: marketPrice.toString(),
    };
  },
);