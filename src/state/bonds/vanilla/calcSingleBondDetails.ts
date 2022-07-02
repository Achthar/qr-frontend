/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { deserializeToken } from 'state/user/hooks/helpers';
import { getContractForBondDepo } from 'utils/contractHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
import { addresses } from 'config/constants/contracts';
import multicall from 'utils/multicall';
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import weightedPairABI from 'config/abi/avax/RequiemWeightedPair.json'
import { getNonQuoteToken, getQuoteToken } from 'utils/bondUtils';
import { BondAssetType } from 'config/constants/types';
import { bnParser } from 'utils/helper';
import { ICalcBondDetailsAsyncThunk } from '../types';
import { priceFromData } from '../loadMarketPrice';
import { BondsState, Bond } from '../../types'

const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export const calcSingleBondDetails = createAsyncThunk(
  "bonds/calcBondDetails",
  async ({ bond, provider, chainId }: ICalcBondDetailsAsyncThunk): Promise<Bond> => {

    const bondContract = getContractForBondDepo(chainId, provider);

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

    // calls from pair used for pricing
    const callsPair = [
      // max payout
      {
        address: market.asset,
        name: 'getReserves'
      },
      // debt ratio
      {
        address: market.asset,
        name: 'totalSupply',
      },
      {
        address: market.asset,
        name: 'balanceOf',
        params: [getAddress(addresses.treasury[chainId])]
      },
    ]

    const [reserves, supply, purchasedQuery] = await multicall(chainId, weightedPairABI, callsPair)

    // calculate price
    const price = bond.tokens && bond.quoteTokenIndex && bond.assetType === BondAssetType.PairLP ? priceFromData(
      deserializeToken(getNonQuoteToken(bond)),
      deserializeToken(getQuoteToken(bond)),
      BigNumber.from(bond.lpProperties.weightToken),
      BigNumber.from(bond.lpProperties.weightQuoteToken),
      reserves[0],
      reserves[1],
      BigNumber.from(bond.lpProperties.fee)
    ) : '0'

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
      },
      market: {
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