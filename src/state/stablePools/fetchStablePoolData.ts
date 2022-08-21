/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
import multicall from 'utils/multicall';
import stableSwapAVAX from 'config/abi/oasis/StablePool.json'
import erc20 from 'config/abi/erc20.json'
import { stableSwapInitialData } from 'config/constants/stablePools';
import { Fraction } from '@requiemswap/sdk';
import { PoolConfig, SerializedStablePool } from '../types'

const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export function bnParser(bn: BigNumber, decNr: BigNumber) {
  return Number(new Fraction(bn, decNr).toSignificant(18))
}


interface PoolRequestData {
  chainId: number
  pool: PoolConfig
}


export const fetchStablePoolData = createAsyncThunk(
  "stablePools/fetchStablePoolData",
  async ({ pool, chainId }: PoolRequestData): Promise<SerializedStablePool> => {

    // fallback if chainId is changed
    if (chainId !== pool.tokens[0].chainId) {
      pool = stableSwapInitialData[chainId][pool.key]
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
      // swap storage
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
        name: 'getA',
        params: []
      },
      {
        address: poolAddress,
        name: 'totalSupply',
        params: []
      },
    ]

    const [multipliers, swapStorage, tokenBalances, A, supply] = await multicall(
      chainId,
      stableSwapAVAX,
      calls
    )

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
        lpAddress: swapStorage.lpToken,
        fee: swapStorage.fee.toString(),
        adminFee: swapStorage.adminFee.toString(),
        initialA: swapStorage.initialA.toString(),
        futureA: swapStorage.futureA.toString(),
        initialATime: swapStorage.initialATime.toString(),
        futureATime: swapStorage.futureATime.toString(),
        defaultWithdrawFee: swapStorage.defaultWithdrawFee.toString(),
      },
      lpTotalSupply: supply[0].toString(),
      A: A.toString()
    }
  }
);