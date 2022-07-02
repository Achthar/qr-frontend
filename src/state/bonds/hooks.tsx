import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { BIG_ZERO } from 'utils/bigNumber'
import { bondConfig } from 'config/constants/bonds'
import { AmplifiedWeightedPair, Price, StablePool, TokenAmount, WeightedPool, ZERO } from '@requiemswap/sdk'
import { pairValuation } from 'utils/pricers/weightedPairPricer'
import { stablePoolValuation } from 'utils/pricers/stablePoolPricer'
import { weightedPoolValuation } from 'utils/pricers/weightedPoolPricer'
import { ethers } from 'ethers'
import getChain from 'utils/getChain'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import { deserializeToken } from 'state/user/hooks/helpers'
import useRefresh from 'hooks/useRefresh'
import { simpleRpcProvider } from 'utils/providers'
import { OracleData, OracleState } from 'state/oracles/reducer'
import { BondAssetType, BondType } from 'config/constants/types'
import { calcSingleBondStableLpDetails } from './vanilla/calcSingleBondStableLpDetails'
import { calcSingleBondDetails } from './vanilla/calcSingleBondDetails'
import { setLpLink, setLpPrice } from './actions'
import { fetchBondMeta, fetchBondUserDataAsync, fetchCallableBondUserDataAsync, fetchCallBondUserDataAsync, fetchClosedBondsUserAsync } from '.'
import { calcSingleCallBondPoolDetails } from './call/calcSingleCallBondPoolDetails'
import { calcSingleCallBondDetails } from './call/calcSingleCallBondDetails'
import { calcSingleCallableBondDetails } from './callable/calcSingleCallBondDetails'
import { calcSingleCallableBondPoolDetails } from './callable/calcSingleCallBondPoolDetails'
import { State, Bond, BondsState, CallBond, CallableBond } from '../types'

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}


export const usePollBondsWithUserData = (chainId: number, includeArchive = false) => {
  const dispatch = useAppDispatch()
  const { slowRefresh, fastRefresh } = useRefresh()
  const { account, library } = useActiveWeb3React()
  const { metaLoaded, bondData, callBondData, callableBondData } = useBonds()
  useEffect(() => {
    // const bondsToFetch = bondList(chainId)


    // const bondIds = bondsToFetch.map((bondToFetch) => bondToFetch.bondId)

    if (!metaLoaded) {
      const bondMeta = bondConfig(chainId)
      dispatch(fetchBondMeta({ chainId, bondMeta }))
    } else {
      const bondsToFetch = Object.values(bondData)
      const callBondsToFetch = Object.values(callBondData)
      const callableBondsToFetch = Object.values(callableBondData)

      bondsToFetch.map(
        (bond) => {
          if (bond.bondType === BondType.Vanilla) {
            if (bond.assetType === BondAssetType.PairLP) {
              dispatch(calcSingleBondDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
            if (bond.assetType === BondAssetType.StableSwapLP || bond.assetType === BondAssetType.WeightedPoolLP) {
              dispatch(calcSingleBondStableLpDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
          }
          return 0
        }
      )

      callBondsToFetch.map(
        (bond) => {
          if (bond.bondType === BondType.Call) {
            if (bond.assetType === BondAssetType.PairLP) {
              dispatch(calcSingleCallBondDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
            if (bond.assetType === BondAssetType.StableSwapLP || bond.assetType === BondAssetType.WeightedPoolLP) {
              dispatch(calcSingleCallBondPoolDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
          }
          return 0
        }
      )

      callableBondsToFetch.map(
        (bond) => {
          if (bond.bondType === BondType.Callable) {
            if (bond.assetType === BondAssetType.PairLP) {
              dispatch(calcSingleCallableBondDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
            if (bond.assetType === BondAssetType.StableSwapLP || bond.assetType === BondAssetType.WeightedPoolLP) {
              dispatch(calcSingleCallableBondPoolDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
          }
          return 0
        }
      )
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

  const { bondData: bonds, userDataLoaded, callBondData: callBonds, callableBondData: callableBonds, closedMarketsLoaded, vanillaNotesClosed, callNotesClosed, callableNotesClosed } = useBonds()
  useEffect(() => {
    if (metaLoaded) {
      // fetch user data if account provided
      if (account) {
        if (!userDataLoaded) {
          dispatch(fetchBondUserDataAsync({ chainId, account, bonds: Object.values(bonds) }))
          dispatch(fetchCallableBondUserDataAsync({ chainId, account, bonds: Object.values(callableBonds) }))
          dispatch(fetchCallBondUserDataAsync({ chainId, account, bonds: Object.values(callBonds) }))
        }

        if (!closedMarketsLoaded && userDataLoaded && (callNotesClosed.length > 0 || vanillaNotesClosed.length > 0 || callableNotesClosed.length > 0)) {
          dispatch(fetchClosedBondsUserAsync({
            chainId,
            bIds: vanillaNotesClosed.map(no => no.marketId).filter(onlyUnique),
            bIdsC: callNotesClosed.map(noC => noC.marketId).filter(onlyUnique),
            bIdsCallable: callableNotesClosed.map(noC => noC.marketId).filter(onlyUnique)
          }))
        }
      }
    }
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      metaLoaded,
      fastRefresh,
      account,
      bonds,
      callBonds,
      closedMarketsLoaded,
      vanillaNotesClosed,
      callNotesClosed
    ])
}

/**
 * Fetches the "core" bond data used globally
 */

export const useBonds = (): BondsState => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds
}

export const useClosedVanillaMarkets = () => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds.vanillaBondsClosed
}

export const useClosedCallMarkets = () => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds.callBondsClosed
}


export const useClosedCallableMarkets = () => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds.callableBondsClosed
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


export const useCallBondFromBondId = (bondId): CallBond => {

  const bond = useSelector((state: State) => state.bonds.callBondData[bondId])
  return bond
}

export const useCallBondFromBondIds = (bondIds: number[]): CallBond[] => {

  const bond = useSelector((state: State) => state.bonds.callBondData)
  return bondIds.map(bId => bond[bId])
}

export const useCallableBondFromBondId = (bondId): CallableBond => {

  const bond = useSelector((state: State) => state.bonds.callableBondData[bondId])
  return bond
}

export const useCallableBondFromBondIds = (bondIds: number[]): CallableBond[] => {

  const bond = useSelector((state: State) => state.bonds.callableBondData)
  return bondIds.map(bId => bond[bId])
}


/**
 *  Returns bond user data for id
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

/**
 *  Returns call bond user data for id
 */
export const useCallBondUser = (bondId) => {
  const bond = useCallBondFromBondId(bondId)
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

/**
 *  Returns bond user data for id
 */
export const useCallableBondUser = (bondId) => {
  const bond = useCallableBondFromBondId(bondId)
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
  const metaLoaded = bonds.metaLoaded

  /** VANILLA bonds start here */
  const data = bonds.bondData
  useEffect(() => {
    if (!metaLoaded) return;
    const bondsWithIds = Object.values(data)
    bondsWithIds.map(bondWithNoPrice => {
      let price: ethers.BigNumber;
      let link: string;
      const bondType = bondWithNoPrice.assetType

      if (!bondWithNoPrice.lpData) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // pair LP
      if (bondType === BondAssetType.PairLP) {
        const supply = ethers.BigNumber.from(bondWithNoPrice.lpData.lpTotalSupply)
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pair: AmplifiedWeightedPair = pairs.find(p => p.address === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId]))

        if (!pairsLoaded || !pair) {
          // eslint-disable-next-line no-useless-return
          return;
        }

        link = `/${getChain(chainId)}/add/${pair.weight0}-${pair.token0.address}/${pair.weight1}-${pair.token1.address}`
        price = pairValuation(pair, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, supply)

      }
      // stable pool LP
      else if (bondType === BondAssetType.StableSwapLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = stablePools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!stableLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }
        link = `/${getChain(chainId)}/add/stables`
        price = stablePoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }
      // weighted pool LP
      else if (bondType === BondAssetType.WeightedPoolLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = weightedPools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!weightedLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }
        link = `/${getChain(chainId)}/add/weighted`
        price = weightedPoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }

      dispatch(setLpPrice({ price: price?.toString() ?? '1', bondId: bondWithNoPrice.bondId, bondType: BondType.Vanilla }))
      dispatch(setLpLink({ link, bondId: bondWithNoPrice.bondId, bondType: BondType.Vanilla }))
      // eslint-disable-next-line no-useless-return
      return;
    })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, metaLoaded, chainId, pairsLoaded, stableLoaded]
  )

  /** CALL bonds start here */
  const callData = bonds.callBondData

  useEffect(() => {
    if (!metaLoaded) return;
    const bondsWithIds = Object.values(callData)
    bondsWithIds.map(bondWithNoPrice => {
      let price: ethers.BigNumber;
      let link: string;
      const bondType = bondWithNoPrice.assetType

      if (!bondWithNoPrice.lpData) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // pair LP
      if (bondType === BondAssetType.PairLP) {
        const supply = ethers.BigNumber.from(bondWithNoPrice.lpData.lpTotalSupply)
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pair: AmplifiedWeightedPair = pairs.find(p => p.address === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId]))

        if (!pairsLoaded || !pair) {
          // eslint-disable-next-line no-useless-return
          return;
        }

        link = `/${getChain(chainId)}/add/${pair.weight0}-${pair.token0.address}/${pair.weight1}-${pair.token1.address}`
        price = pairValuation(pair, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, supply)

      }
      // stable pool LP
      else if (bondType === BondAssetType.StableSwapLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = stablePools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!stableLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }
        link = `/${getChain(chainId)}/add/stables`
        price = stablePoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }
      // weighted pool LP
      else if (bondType === BondAssetType.WeightedPoolLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = weightedPools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!weightedLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }
        link = `/${getChain(chainId)}/add/weighted`
        price = weightedPoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }

      dispatch(setLpPrice({ price: price?.toString() ?? '1', bondId: bondWithNoPrice.bondId, bondType: BondType.Call }))
      dispatch(setLpLink({ link, bondId: bondWithNoPrice.bondId, bondType: BondType.Call }))
      // eslint-disable-next-line no-useless-return
      return;
    })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callData, metaLoaded, chainId, pairsLoaded, stableLoaded]
  )


  /** CALL bonds start here */
  const callableData = bonds.callableBondData

  useEffect(() => {
    if (!metaLoaded) return;
    const bondsWithIds = Object.values(callableData)
    bondsWithIds.map(bondWithNoPrice => {
      let price: ethers.BigNumber;
      let link: string;
      const bondType = bondWithNoPrice.assetType

      if (!bondWithNoPrice.lpData) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // pair LP
      if (bondType === BondAssetType.PairLP) {
        const supply = ethers.BigNumber.from(bondWithNoPrice.lpData.lpTotalSupply)
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pair: AmplifiedWeightedPair = pairs.find(p => p.address === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId]))

        if (!pairsLoaded || !pair) {
          // eslint-disable-next-line no-useless-return
          return;
        }

        link = `/${getChain(chainId)}/add/${pair.weight0}-${pair.token0.address}/${pair.weight1}-${pair.token1.address}`
        price = pairValuation(pair, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, supply)
      }
      // stable pool LP
      else if (bondType === BondAssetType.StableSwapLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = stablePools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!stableLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }
        link = `/${getChain(chainId)}/add/stables`
        price = stablePoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }
      // weighted pool LP
      else if (bondType === BondAssetType.WeightedPoolLP) {
        const amount = ethers.BigNumber.from(bondWithNoPrice.market.purchased)
        const pool = weightedPools.find(p =>
          ethers.utils.getAddress(p.liquidityToken.address) === ethers.utils.getAddress(bondWithNoPrice.reserveAddress[chainId])
        )

        if (!weightedLoaded || !pool || pool?.lpTotalSupply.eq(0)) {
          // eslint-disable-next-line no-useless-return
          return;
        }
        link = `/${getChain(chainId)}/add/weighted`
        price = weightedPoolValuation(pool, deserializeToken(bondWithNoPrice.tokens[bondWithNoPrice.quoteTokenIndex]), amount, pool?.lpTotalSupply)
      }

      dispatch(setLpPrice({ price: price?.toString() ?? '1', bondId: bondWithNoPrice.bondId, bondType: BondType.Callable }))
      dispatch(setLpLink({ link, bondId: bondWithNoPrice.bondId, bondType: BondType.Callable }))
      // eslint-disable-next-line no-useless-return
      return;
    })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callData, metaLoaded, chainId, pairsLoaded, stableLoaded]
  )
}

export const useGetOracleData = (chainId: number, address: string, oracles: { [address: string]: OracleData }): OracleData => {
  if (!address)
    return null

  if (!oracles)
    return null

  return oracles[address]
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