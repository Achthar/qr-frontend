/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
import { addresses } from 'config/constants/contracts';
import multicall from 'utils/multicall';
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import weightedPoolAVAX from 'config/abi/avax/WeightedPool.json'
import erc20 from 'config/abi/erc20.json'
import { weightedSwapInitialData } from 'config/constants/weightedPool';
import { BondAssetType } from 'config/constants/types';
import { Fraction, TokenAmount } from '@requiemswap/sdk';
import { BondsState, Bond, PoolConfig, SerializedWeightedPool } from '../types'

const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


interface PoolRequestData {
  chainId: number
  pool: PoolConfig
}


export const fetchWeightedPoolData = createAsyncThunk(
  "stablePools/fetchWeightedPoolData",
  async ({ pool, chainId }: PoolRequestData): Promise<SerializedWeightedPool> => {

    // fallback if chainId is changed
    if (chainId !== pool.tokens[0].chainId) {
      pool = weightedSwapInitialData[chainId][pool.key]
    }
    const poolAddress = getAddress(pool.address)

    // // cals for general pool data
    const calls = [
      // token multipliers
      {
        address: poolAddress,
        name: 'getTokenMultipliers',
        params: []
      },
      // mswap storage
      {
        address: poolAddress,
        name: 'swapStorage',
        params: []
      },
      // token balances
      {
        address: poolAddress,
        name: 'getTokenBalances',
        params: []
      },
      // amplification parameter
      {
        address: poolAddress,
        name: 'getTokenWeights',
        params: []
      },
    ]

    const [multipliers, swapStorage, tokenBalances, tokenWeights] =
      await multicall(chainId, weightedPoolAVAX, calls)


    // calls from pair used for pricing
    const callsLp = [
      // total supply of LP token
      {
        address: swapStorage.lpAddress ?? pool.lpAddress,
        name: 'totalSupply',
      },
    ]

    const [supply] = await multicall(chainId, erc20, callsLp)

    return {
      ...pool,
      balances: tokenBalances[0].map(balance => balance.toString()),
      lpToken: {
        address: swapStorage.lpToken,
        chainId,
        decimals: 18,
        symbol: pool.key
      },
      swapStorage: {
        tokenMultipliers: multipliers[0].map(multiplier => multiplier.toString()),
        normalizedTokenWeights: tokenWeights[0].map(w => w.toString()),
        lpAddress: swapStorage.lpToken,
        fee: swapStorage.fee.toString(),
        adminFee: swapStorage.adminFee.toString(),

      },
      lpTotalSupply: supply[0].toString(),
    }
  }
);