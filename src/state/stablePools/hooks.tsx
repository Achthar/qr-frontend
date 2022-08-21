import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import { Price, StablePool, STABLES_LP_TOKEN, StableSwapStorage, Token, TokenAmount } from '@requiemswap/sdk'
import { BondAssetType, SerializedToken } from 'config/constants/types'
import { deserializeToken } from 'state/user/hooks/helpers'
import { State, Bond, BondsState, StablePoolsState, StablePoolData } from '../types'



/**
 * Fetches the "core" bond data used globally
 */

export const useStablePools = (chainId: number): StablePoolData => {
  const pools = useSelector((state: State) => state.stablePools)
  return pools.poolData[chainId]
}

export const useStablePoolReferenceChain = () => {
  return useSelector((state: State) => state.stablePools.referenceChain)
}

export const useStablePoolLpBalance = (chainId: number, id: number) => {
  const poolState = useSelector((state: State) => state.stablePools)
  const pools = poolState.poolData[chainId].pools
  if (!pools[id]) return null
  const lpToken = new Token(chainId, pools[id].address, 18)// fallback
  return new TokenAmount(lpToken, pools[id]?.userData?.lpBalance ?? '0')
}

export const useDeserializedStablePools = (chainId: number): StablePool[] => {
  const poolState = useSelector((state: State) => state.stablePools)
  const { pools, publicDataLoaded: dataLoaded } = poolState.poolData[chainId]
  const currentBlock = useSelector((state: State) => state.block.currentBlock)

  if (!dataLoaded || pools.length === 0 || poolState.referenceChain !== chainId)
    return []

  return pools.map(pool => {
    const poolS = new StablePool(
      pool.tokens.map(t => deserializeToken(t)),
      pool.balances.map(balance => BigNumber.from(balance ?? '0')),
      BigNumber.from(pool?.A ?? '0'),
      new StableSwapStorage(
        pool?.swapStorage.tokenMultipliers.map(m => BigNumber.from(m)),
        BigNumber.from(pool?.swapStorage.fee ?? '0'),
        BigNumber.from(pool?.swapStorage.adminFee ?? '0'),
        BigNumber.from(pool?.swapStorage.initialA ?? '0'),
        BigNumber.from(pool?.swapStorage.futureA ?? '0'),
        BigNumber.from(pool?.swapStorage.initialATime ?? '0'),
        BigNumber.from(pool?.swapStorage.futureATime ?? '0'),
        pool.swapStorage.lpAddress
      ),
      currentBlock,
      BigNumber.from(pool?.lpTotalSupply ?? '0'),
      BigNumber.from(pool?.userData?.userWithdarawFee ?? 0),
      pool.address,
      pool.lpAddress
    )
    poolS.name = pool.name

    return poolS
  }
  )
}
