import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { BIG_ZERO } from 'utils/bigNumber'
import { bondConfig } from 'config/constants/bonds'
import { AmplifiedWeightedPair, Price, StablePool, TokenAmount, WeightedPool } from '@requiemswap/sdk'
import { pairValuation } from 'utils/pricers/weightedPairPricer'
import { stablePoolValuation } from 'utils/pricers/stablePoolPricer'
import { weightedPoolValuation } from 'utils/pricers/weightedPoolPricer'
import { ethers } from 'ethers'
import { deserializeToken } from 'state/user/hooks/helpers'
import useRefresh from 'hooks/useRefresh'
import { simpleRpcProvider } from 'utils/providers'
import { BondType } from 'config/constants/types'
import { calcSingleBondStableLpDetails } from './calcSingleBondStableLpDetails'
import { calcSingleBondDetails } from './calcSingleBondDetails'
import { setLpPrice } from './actions'
import { fetchBondMeta, fetchBondUserDataAsync, nonArchivedBonds } from '.'
import { State, Bond, BondsState } from '../types'

export const usePollBondsWithUserData = (chainId: number, includeArchive = false) => {
  const dispatch = useAppDispatch()
  const { slowRefresh } = useRefresh()
  const { account, library } = useWeb3React()
  const { metaLoaded, bondData, userDataLoaded } = useBonds()
  useEffect(() => {
    // const bondsToFetch = bondList(chainId)


    // const bondIds = bondsToFetch.map((bondToFetch) => bondToFetch.bondId)

    if (!metaLoaded) {
      const bondMeta = bondConfig(chainId)
      dispatch(fetchBondMeta({ chainId, bondMeta }))
    } else {
      const bondsToFetch = Object.values(bondData)
      bondsToFetch.map(
        (bond) => {
          if (bond.type === BondType.PairLP) {
            dispatch(calcSingleBondDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
          }
          if (bond.type === BondType.StableSwapLP || bond.type === BondType.WeightedPoolLP) {
            dispatch(calcSingleBondStableLpDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
          }
          return 0
        }
      )

      if (account) {
        const bondIds = Object.keys(bondData).map(k => Number(k))
        // const relevantAddresses = useReserveAddressFromBondIds(chainId, bondIds)
        dispatch(fetchBondUserDataAsync({ chainId, account, bonds: bondsToFetch }))
      }
    }

  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chainId,
      includeArchive,
      dispatch,
      library,
      slowRefresh,
      account,
      metaLoaded
    ])
}

/**
 * Fetches the "core" bond data used globally
 */

export const useBonds = (): BondsState => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds
}

export const useReserveAddressFromBondIds = (chainId: number, bondIds: number[]): string[] => {
  const bonds = useSelector((state: State) => state.bonds)
  return bondIds.map(id => bonds.bondData[id].reserveAddress[chainId])

}

export const useBondFromBondId = (bondId): Bond => {

  const bond = useSelector((state: State) => state.bonds.bondData[bondId])
  return bond
}

export const useBondFromBondIds = (bondIds: number[]): Bond[] => {

  const bond = useSelector((state: State) => state.bonds.bondData)
  return bondIds.map(bId => bond[bId])
}

/**
 *  Returns bobnd user data for id
 */
export const useBondUser = (bondId) => {
  const bond = useBondFromBondId(bondId)
  if (bond) {
    return {
      allowance: bond.userData ? new BigNumber(bond.userData.allowance) : BIG_ZERO,
      tokenBalance: bond.userData ? new BigNumber(bond.userData.tokenBalance) : BIG_ZERO,
      stakedBalance: bond.userData ? new BigNumber(bond.userData.stakedBalance) : BIG_ZERO,
      earnings: bond.userData ? new BigNumber(bond.userData.earnings) : BIG_ZERO,
      notes: bond?.userData?.notes
    }
  }

  return {
    allowance: BIG_ZERO,
    tokenBalance: BIG_ZERO,
    stakedBalance: BIG_ZERO,
    earnings: BIG_ZERO,
  }
}


export interface PricingInput {
  chainId: number
  weightedPools: WeightedPool[]
  weightedLoaded: boolean
  stablePools: StablePool[]
  stableLoaded: boolean
  pairs: AmplifiedWeightedPair[]
  pairsLoaded: boolean
}


/**
 *  Prices all bonds using the trading state (pairs and pools)
 */
export const useLpPricing = ({ chainId, weightedPools, weightedLoaded, stablePools, stableLoaded, pairs, pairsLoaded }: PricingInput) => {
  const bonds = useBonds()
  const dispatch = useAppDispatch()
  const data = bonds.bondData
  const metaLoaded = bonds.metaLoaded

  useEffect(() => {
    if (!metaLoaded) return;
    const bondsWithIds = Object.values(data)
    bondsWithIds.map(bondWithNoPrice => {
      let price: ethers.BigNumber;
      const bondType = bondWithNoPrice.type

      if (!bondWithNoPrice.lpData) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // pair LP
      if (bondType === BondType.PairLP) {
        const supply = ethers.BigNumber.from(bondWithNoPrice.lpData.lpTotalSupply)
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pair = pairs.find(p => p.address === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId]))

        if (!pairsLoaded) {
          // eslint-disable-next-line no-useless-return
          return;
        }

        price = pairValuation(pair, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, supply)
      }
      // stable pool LP
      else if (bondType === BondType.StableSwapLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = stablePools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!stableLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }

        price = stablePoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }
      // weighted pool LP
      else if (bondType === BondType.WeightedPoolLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = weightedPools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!weightedLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }

        price = weightedPoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }

      dispatch(setLpPrice({ price: price?.toString() ?? '1', bondId: bondWithNoPrice.bondId }))
      // eslint-disable-next-line no-useless-return
      return;
    })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, metaLoaded, chainId, pairsLoaded, stableLoaded]
  )
}

// /!\ Deprecated , use the BUSD hook in /hooks

export const usePriceNetworkCCYUsd = (): BigNumber => {
  const bnbUsdBond = useBondFromBondId(1)
  return new BigNumber(3243) // new BigNumber(bnbUsdBond.quoteToken.busdPrice)
}


export const usePriceNetworkDollar = (): BigNumber => {
  const networkDollarBond = useBondFromBondId(1)
  return new BigNumber(806) // new BigNumber(networkDollarBond.quoteToken.busdPrice)
}


export const usePriceRequiemDollar = (): BigNumber => {
  const requiemDollarBond = useBondFromBondId(251)

  const requiemPriceDollarAsString = '1.321' // requiemDollarBond.token.busdPrice

  const reqtPriceUsd = useMemo(() => {
    return new BigNumber(requiemPriceDollarAsString)
  }, [requiemPriceDollarAsString])

  return reqtPriceUsd
}