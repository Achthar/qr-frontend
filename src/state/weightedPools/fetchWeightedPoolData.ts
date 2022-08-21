/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAddress } from 'ethers/lib/utils';
import multicall from 'utils/multicall';
import weightedPoolAVAX from 'config/abi/avax/WeightedPool.json'
import weightedPoolROSE from 'config/abi/oasis/WeightedPool.json'
import erc20 from 'config/abi/erc20.json'
import { weightedSwapInitialData } from 'config/constants/weightedPool';
import { PoolConfig, SerializedWeightedPool } from '../types'

interface PoolRequestData {
  chainId: number
  pool: PoolConfig
}


export const fetchWeightedPoolData = createAsyncThunk(
  "weightedPools/fetchWeightedPoolData",
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
      {
        address: poolAddress,
        name: 'totalSupply',
      },
    ]

    const [multipliers, swapStorage, tokenBalances, tokenWeights, supply] =
      await multicall(chainId, chainId === 43113 ? [...weightedPoolAVAX, ...erc20] : weightedPoolROSE, calls)





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
      lpTotalSupply: supply[0].toString()
    }
  }
);