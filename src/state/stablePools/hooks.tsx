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
  const lpToken = deserializeToken(pools[id]?.lpToken)// fallback
  return new TokenAmount(lpToken, pools[id]?.userData?.lpBalance ?? '0')
}

export const useDeserializedStablePools = (chainId: number): StablePool[] => {
  const poolState = useSelector((state: State) => state.stablePools)
  const { pools, publicDataLoaded: dataLoaded } = poolState.poolData[chainId]
  const currentBlock = useSelector((state: State) => state.block.currentBlock)

  if (!dataLoaded)
    return []

  return pools.map(pool => {
    const poolS = new StablePool(
      pool.tokens.map(t => deserializeToken(t)),
      pool.balances.map(balance => BigNumber.from(balance ?? '0')),
      BigNumber.from(pool.A),
      new StableSwapStorage(
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
      BigNumber.from(pool?.userData?.userWithdarawFee ?? 0),
      pool.address,
      pool.lpAddress
    )
    poolS.name = pool.name

    return poolS
  }
  )
}
