import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import { WeightedPool, WeightedSwapStorage, Token, TokenAmount } from '@requiemswap/sdk'
import { deserializeToken } from 'state/user/hooks/helpers'
import { WEIGHTED_POOL_LP } from 'config/constants/tokens'
import { State, WeightedPoolData } from '../types'



/**
 * Fetches the "core" bond data used globally
 */

export const useWeightedPools = (chainId: number): WeightedPoolData => {
  const pools = useSelector((state: State) => state.weightedPools)
  return pools.poolData[chainId]
}

export const useWeightedPoolReferenceChain = () => {
  return useSelector((state: State) => state.weightedPools.referenceChain)
}

export const useWeightedPoolLpBalance = (chainId: number, id: number) => {
  const poolState = useSelector((state: State) => state.weightedPools)
  const pools = poolState.poolData[chainId].pools
  if (!pools[id]) return null
  const lpToken = new Token(chainId, pools[id].address, 18)
  return new TokenAmount(lpToken, pools[id]?.userData?.lpBalance ?? '0')
}

export const useDeserializedWeightedPools = (chainId: number): WeightedPool[] => {
  const poolState = useSelector((state: State) => state.weightedPools)
  const { pools, publicDataLoaded: dataLoaded } = poolState.poolData[chainId]

  if (!dataLoaded || poolState.referenceChain !== chainId)
    return []

  return pools.map(pool => {
    const poolW = new WeightedPool(
      pool?.address,
      pool?.tokens.map(t => deserializeToken(t)),
      pool?.balances.map(balance => BigNumber.from(balance ?? '0')),
      new WeightedSwapStorage(
        pool?.swapStorage?.tokenMultipliers.map(m => BigNumber.from(m)),
        pool?.swapStorage?.normalizedTokenWeights?.map(m => BigNumber.from(m)),
        BigNumber.from(pool?.swapStorage.fee ?? '0'),
        BigNumber.from(pool?.swapStorage.adminFee ?? '0'),
      ),
      BigNumber.from(pool?.lpTotalSupply ?? '0'),
      pool.lpAddress
    )
    poolW.name = pool.name
    return poolW
  }
  )
}
