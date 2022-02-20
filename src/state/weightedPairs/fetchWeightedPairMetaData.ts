/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
import multicall from 'utils/multicall';
import pairFactoryABI from 'config/abi/avax/RequiemWeightedPairFactory.json'
import { BondType, SerializedToken, TokenPair } from 'config/constants/types';
import { getAllTokenPairs } from 'config/constants/tokenPairs';
import { Fraction, JSBI, TokenAmount, WeightedPair, WEIGHTED_FACTORY_ADDRESS } from '@requiemswap/sdk';
import { WeightedPairMetaData } from '../types'


const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export function bnParser(bn: BigNumber, decNr: BigNumber) {
  return Number((new Fraction(JSBI.BigInt(bn.toString()), JSBI.BigInt(decNr.toString()))).toSignificant(18))
}


interface PairRequestData {
  tokenPairs?: TokenPair[]
}


interface MetaRequestData {
  chainId: number
}

// for a provided list of token pairs the funcktion returns a dictionary with the addresses of the
// tokens in the pairs as keys and arrays of addresses as values
export const fetchWeightedPairMetaData = createAsyncThunk(
  "weightedPairs/fetchWeightedPairMetaData",
  async ({ chainId }: MetaRequestData): Promise<{ [pastedAddresses: string]: WeightedPairMetaData[] }> => {
    const tokenPairs = getAllTokenPairs(chainId)
    console.log("WP: INPUT Meta", tokenPairs,)
    // // cals for existing pool addresses
    const calls = tokenPairs.map(pair => {
      return {
        address: getAddress(WEIGHTED_FACTORY_ADDRESS[chainId]),
        name: 'getPairs',
        params: [getAddress(pair.token0.address), getAddress(pair.token1.address)]
      }
    })

    const rawMetaData = await multicall(chainId, pairFactoryABI, calls)

    const existingPairs = rawMetaData.map((entry, index) => entry._tokenPairs.length > 0 ? index : -1).filter((index) => index > -1)

    console.log("WP: RAWMETA", rawMetaData, existingPairs)
    return Object.assign(
      {}, ...existingPairs.map(
        (index) =>
        (
          {
            [`${tokenPairs[index].token0.address}-${tokenPairs[index].token1.address}`]:
              rawMetaData[index]._tokenPairs.map((addr) => ({ address: addr }))
          }
        )
      )
    );

  }
);