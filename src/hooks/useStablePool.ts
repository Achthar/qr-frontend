/** eslint @typescript-eslint/no-shadow:0 */
import {  StablePool, STABLES_INDEX_MAP, STABLE_POOL_ADDRESS, StableSwapStorage } from '@requiemswap/sdk'
import  { useMemo} from 'react'
import { BigNumber } from 'ethers'
import { getStableLpContract, getStableSwapContract } from 'utils/contractHelpers'
import { swapStorageData } from 'config/constants/stableSwapData'
import { useBlock } from 'state/block/hooks'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleFunctions } from '../state/multicall/hooks'




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
    chainId,
    getStableLpContract(chainId),
    'totalSupply',
  )

  // static data, only loaded once
  const aResult = useSingleCallResult(
    chainId,
    getStableSwapContract(chainId),
    'getA', undefined, NEVER_RELOAD
  )

  // token reserves only reload them in shorter cycles
  const tokenReservesResult = useSingleCallResult(
    chainId,
    getStableSwapContract(chainId),
    'getTokenBalances'
  )


  const { currentBlock } = useBlock()

  return useMemo(() => {

    // when loading return signal
    if (tokenReservesResult.loading || aResult.loading || supplyResult.loading || !tokenReservesResult?.result?.[0]) {
      return [
        StablePoolState.LOADING,
        null
      ]
    }

    const swapStorage = new StableSwapStorage(
      Object.values(STABLES_INDEX_MAP[chainId]).map((token) => (BigNumber.from(10)).pow(18 - token.decimals)),
      swapStorageData[chainId].fee,
      swapStorageData[chainId].adminFee,
      swapStorageData[chainId].initialA,
      swapStorageData[chainId].futureA,
      swapStorageData[chainId].initialATime,
      swapStorageData[chainId].futureATime,
      swapStorageData[chainId].lpToken)

    const stablePool = new StablePool(
      Object.values(STABLES_INDEX_MAP[chainId]),
      tokenReservesResult.result?.[0], // ?? Object.values(STABLES_INDEX_MAP[chainId]).map(x => new TokenAmount(x, '0')),
      aResult.result?.[0], // we add the value of A later
      swapStorage,
      currentBlock, // block timestamp to be set later
      supplyResult.result?.[0],
      BigNumber.from(0), // the individual fee is calculated later since its individual
      ''
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


