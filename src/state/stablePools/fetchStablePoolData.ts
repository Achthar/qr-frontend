/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { useMemo } from 'react';
import { deserializeToken } from 'state/user/hooks/helpers';
import { getContractForBondDepo, getContractForLpReserve, getStablePoolContract } from 'utils/contractHelpers';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import { getAddress } from 'ethers/lib/utils';
import { addresses } from 'config/constants/contracts';
import multicall from 'utils/multicall';
import bondReserveAVAX from 'config/abi/avax/BondDepository.json'
import stableSwapAVAX from 'config/abi/avax/RequiemStableSwap.json'
import erc20 from 'config/abi/erc20.json'
import { BondType } from 'config/constants/types';
import { Fraction, JSBI, TokenAmount, WeightedPair } from '@requiemswap/sdk';
import { BondsState, Bond, StablePoolConfig, SerializedStablePool } from '../types'

const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export function bnParser(bn: BigNumber, decNr: BigNumber) {
  return Number((new Fraction(JSBI.BigInt(bn.toString()), JSBI.BigInt(decNr.toString()))).toSignificant(18))
}


interface PoolRequestData {
  chainId: number
  pool: StablePoolConfig
}


export const fetchStablePoolData = createAsyncThunk(
  "stablePools/fetchStablePoolData",
  async ({ pool, chainId }: PoolRequestData): Promise<SerializedStablePool> => {

    const poolAddress = getAddress(pool.address)

    // // cals for general bond data
    const calls = [
      {
        address: poolAddress,
        name: 'getTokenPrecisionMultipliers',
        params: []
      },
      // max payout
      {
        address: poolAddress,
        name: 'swapStorage',
        params: []
      },
      // debt ratio
      {
        address: poolAddress,
        name: 'getTokenBalances',
        params: []
      },
      // debt ratio
      {
        address: poolAddress,
        name: 'getA',
        params: []
      },
    ]

    const [multipliers, swapStorage, tokenBalances, A] =
      await multicall(chainId, stableSwapAVAX, calls)


    // calls from pair used for pricing
    const callsLp = [
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