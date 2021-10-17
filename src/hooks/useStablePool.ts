/** eslint @typescript-eslint/no-shadow:0 */
import { TokenAmount, Pair, Currency, StablePool, STABLES_INDEX_MAP, STABLE_POOL_ADDRESS, SwapStorage } from '@pancakeswap/sdk'
import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import IERC20 from 'config/abi/avax/IERC20.json'
import { serializeError } from 'eth-rpc-errors'
// import { Interface } from '@ethersproject/abi'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { BigNumber } from 'ethers'
import { getStableLpContract, getStableSwapContract } from 'utils/contractHelpers'
import { swapStorageData } from 'config/constants/stableSwapData'
import { simpleRpcProvider } from 'utils/providers'
import useRefresh from './useRefresh'
import { useTotalSupply } from './useTokenBalance'
import { useStableLPContract, useTokenContract } from './useContract'
import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'


// export interface StableSwapData {


// }

export enum StablePoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useStablePool(): [StablePoolState, StablePool | null] {
  const chainId = 43113
  // const { slowRefresh } = useRefresh()

  // for now we only load the supply once on thos 
  // const supplyResult = useSingleCallResult(
  //   getStableLpContract(chainId ?? 43113),
  //   'totalSupply', undefined, NEVER_RELOAD)

  // const [totalSupply, setLpSupply,] = useState<BigNumber>()
  // useEffect(() => {
  //   async function fetchTotalSupply() {
  //     const lpContract = getStableLpContract(chainId ?? 43113)
  //     const supply = await lpContract.totalSupply()
  //     setLpSupply(supply)
  //   }

  //   fetchTotalSupply()
  // }, [chainId, slowRefresh])

  // static data, only loaded once
  // const aResult = useSingleCallResult(
  //   getStableSwapContract(chainId ?? 43113),
  //   'getA', undefined, NEVER_RELOAD)

  // const [a, setA] = useState<BigNumber>()
  // useEffect(() => {
  //   async function fetchA() {
  //     const stableSwapContract = getStableSwapContract(chainId ?? 43113)
  //     const _A = await stableSwapContract.getA()
  //     setA(_A)
  //   }

  //   fetchA()
  // }, [chainId, slowRefresh])


  // token reserves only reload them in shorter cycles
  // const tokenReservesResult = useSingleCallResult(
  //   getStableSwapContract(chainId ?? 43113),
  //   'getTokenBalances', undefined, NEVER_RELOAD)


  // const [tokenBalances, setTokenBalances] = useState<BigNumber[]>()
  // useEffect(() => {
  //   async function fetchTokenBalances() {
  //     const stableSwapContract = getStableSwapContract(chainId ?? 43113)
  //     const balances = await stableSwapContract.getTokenBalances()
  //     setTokenBalances(balances)
  //   }

  //   fetchTokenBalances()
  // }, [chainId, slowRefresh])




  // console.log("reserves", tokenReservesResult)

  // const fetchLpSupply = useCallback(async () => {
  //   const response = await getStableLpContract(chainId ?? 43113).totalSupply()
  //   return response
  // }, [chainId])

  // useEffect(() => {
  //   fetchLpSupply()
  // }, [fetchLpSupply])

  // fetchLpSupply()

  // const callWithGasPrice = await getStableLpContract(chainId ?? 43113).totalSupply()


  // const { A } = useMemo(() => {
  //   const { result, loading } = aResult
  //   return result?.[0] ?? BigNumber.from(0)
  // }, [aResult])
  /*
    return useMemo(() => {
  
      // when loading return signal
      if (tokenReservesResult.loading) {
        return [
          StablePoolState.LOADING,
          null
        ]
      }
  
      const swapStorage = new SwapStorage(
        Object.values(STABLES_INDEX_MAP[chainId ?? 43113]).map((token) => (BigNumber.from(10)).pow(18 - token.decimals)),
        swapStorageData[chainId].fee,
        swapStorageData[chainId].adminFee,
        swapStorageData[chainId].initialA,
        swapStorageData[chainId].futureA,
        swapStorageData[chainId].initialATime,
        swapStorageData[chainId].futureATime,
        swapStorageData[chainId].lpToken)
  
      const stablePool = new StablePool(
        STABLES_INDEX_MAP[chainId ?? 43113],
        tokenReservesResult.result as BigNumber[],
        A, // we add the value of A later
        swapStorage,
        0, // block timestamp to be set later
        supplyResult.result[0],
        BigNumber.from(0) // the fee is calculated later since its individual
      )
  
      console.log(stablePool)
  
      return [
        StablePoolState.EXISTS,
        stablePool,
      ]
    }, [
      chainId,
      A,
      tokenReservesResult.result,
      tokenReservesResult.loading,
      supplyResult.loading
  
    ]) */


  return useMemo(() => {

    const tokenBalances = [BigNumber.from(0)]
    const a = BigNumber.from(0)
    const totalSupply = BigNumber.from(0)
    // if (tokenReservesResult.loading) {
    //   return [
    //     StablePoolState.LOADING,
    //     null
    //   ]
    // }
    const swapStorage = new SwapStorage(
      Object.values(STABLES_INDEX_MAP[chainId ?? 43113]).map((token) => (BigNumber.from(10)).pow(18 - token.decimals)),
      swapStorageData[chainId].fee,
      swapStorageData[chainId].adminFee,
      swapStorageData[chainId].initialA,
      swapStorageData[chainId].futureA,
      swapStorageData[chainId].initialATime,
      swapStorageData[chainId].futureATime,
      swapStorageData[chainId].lpToken)


    // const stablePool = new StablePool(
    //   STABLES_INDEX_MAP[chainId ?? 43113],
    //   tokenBalances,
    //   a, // we add the value of A later
    //   swapStorage,
    //   0, // block timestamp to be set later
    //   totalSupply,
    //   BigNumber.from(0) // the fee is calculated later since its individual
    // )

    // console.log(stablePool)

    return [
      StablePoolState.EXISTS,
      null,
    ]
  }, [
    chainId,
    // a,
    // tokenBalances,
    // totalSupply
  ])
}


