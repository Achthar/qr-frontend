import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { BigNumber } from 'ethers'
import { Price, StablePool, STABLES_LP_TOKEN, SwapStorage, Token, TokenAmount } from '@requiemswap/sdk'
import { BondType, SerializedToken } from 'config/constants/types'
import { deserializeToken } from 'state/user/hooks/helpers'
import { STABLE_POOL_LP } from 'config/constants/tokens'
import { State, Bond, BondsState, StablePoolsState, PoolData } from '../types'



/**
 * Fetches the "core" bond data used globally
 */

export const useStablePools = (chainId: number): PoolData => {
  const pools = useSelector((state: State) => state.stablePools)
  return pools.poolData[chainId]
}

export const useStablePoolReferenceChain = () => {
  return useSelector((state: State) => state.stablePools.referenceChain)
}

export const useBondFromBondId = (bondId): Bond => {

  const bond = useSelector((state: State) => state.bonds.bondData[bondId])
  return bond
}

function generateTokenDict(serializedTokens: SerializedToken[]): { [id: number]: Token } {
  return Object.assign({},
    ...Object.values(serializedTokens).map(
      (x, index) => ({ [index]: new Token(x.chainId, x.address, x.decimals, x.symbol, x.name) })
    )
  )
}

export const useStablePoolLpBalance = (chainId: number, id: number) => {
  const poolState = useSelector((state: State) => state.stablePools)
  const pools = poolState.poolData[chainId].pools
  const lpToken = pools[id]?.lpToken ? deserializeToken(pools[id]?.lpToken) : STABLE_POOL_LP[chainId] // fallback
  return new TokenAmount(lpToken, pools[id]?.userData?.lpBalance ?? '0')
}

export const useDeserializedStablePools = (chainId: number): StablePool[] => {
  const poolState = useSelector((state: State) => state.stablePools)
  const { pools, publicDataLoaded: dataLoaded } = poolState.poolData[chainId]
  const currentBlock = useSelector((state: State) => state.block.currentBlock)

  if (!dataLoaded)
    return []

  return pools.map(pool => new StablePool(
    generateTokenDict(pool.tokens),
    pool.balances.map(balance => BigNumber.from(balance ?? '0')),
    BigNumber.from(pool.A),
    new SwapStorage(
      pool.swapStorage.tokenMultipliers.map(m => BigNumber.from(m)),
      BigNumber.from(pool.swapStorage.fee),
      BigNumber.from(pool.swapStorage.adminFee),
      BigNumber.from(pool.swapStorage.initialA),
      BigNumber.from(pool.swapStorage.futureA),
      BigNumber.from(pool.swapStorage.initialATime),
      BigNumber.from(pool.swapStorage.futureATime),
      pool.swapStorage.lpAddress
    ),
    currentBlock,
    BigNumber.from(pool.lpTotalSupply),
    BigNumber.from(0)
  )
  )
}
