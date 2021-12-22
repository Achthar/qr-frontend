/** eslint @typescript-eslint/no-shadow:0 */
import { TokenAmount, Pair, Currency, StablePool, STABLES_INDEX_MAP, STABLE_POOL_ADDRESS, SwapStorage } from '@requiemswap/sdk'
import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import IERC20 from 'config/abi/avax/IERC20.json'
// import { serializeError } from 'eth-rpc-errors'
// import { Interface } from '@ethersproject/abi'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { BigNumber } from 'ethers'
import { getStableLpContract, getStableSwapContract } from 'utils/contractHelpers'
import { swapStorageData } from 'config/constants/stableSwapData'
import { useBlock } from 'state/block/hooks'
import useRefresh from './useRefresh'
import { useTotalSupply } from './useTokenBalance'
import { useStableLPContract, useTokenContract } from './useContract'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleFunctions } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'



export enum StablePoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useStablePool(chainId: number): [StablePoolState, StablePool | null] {
  // const { slowRefresh } = useRefresh()

  // for now we only load the supply once on thos 
  const supplyResult = useSingleCallResult(
    getStableLpContract(chainId),
    'totalSupply',
  )

  // static data, only loaded once
  const aResult = useSingleCallResult(
    getStableSwapContract(chainId),
    'getA', undefined
  )

  // token reserves only reload them in shorter cycles
  const tokenReservesResult = useSingleCallResult(
    getStableSwapContract(chainId),
    'getTokenBalances'
  )

  const { currentBlock } = useBlock()

  return useMemo(() => {

    // when loading return signal
    if (tokenReservesResult.loading || aResult.loading || supplyResult.loading) {
      return [
        StablePoolState.LOADING,
        null
      ]
    }

    const swapStorage = new SwapStorage(
      Object.values(STABLES_INDEX_MAP[chainId]).map((token) => (BigNumber.from(10)).pow(18 - token.decimals)),
      swapStorageData[chainId].fee,
      swapStorageData[chainId].adminFee,
      swapStorageData[chainId].initialA,
      swapStorageData[chainId].futureA,
      swapStorageData[chainId].initialATime,
      swapStorageData[chainId].futureATime,
      swapStorageData[chainId].lpToken)

    const stablePool = new StablePool(
      STABLES_INDEX_MAP[chainId],
      tokenReservesResult.result?.[0],
      aResult.result?.[0], // we add the value of A later
      swapStorage,
      currentBlock, // block timestamp to be set later
      supplyResult.result?.[0],
      BigNumber.from(0) // the individual fee is calculated later since its individual
    )

    return [
      StablePoolState.EXISTS,
      stablePool,
    ]
  }, [
    chainId,
    aResult.loading,
    aResult.result,
    tokenReservesResult.result,
    tokenReservesResult.loading,
    supplyResult.loading,
    supplyResult.result,
    currentBlock

  ])
}


