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
import { changeChainIdBonds, setLpLink, setLpPrice } from './actions'
import { fetchBondMeta, fetchBondUserDataAsync, fetchCallableBondUserDataAsync, fetchCallBondUserDataAsync, fetchClosedBondsUserAsync } from '.'
import { calcSingleCallBondPoolDetails } from './call/calcSingleCallBondPoolDetails'
import { calcSingleCallBondDetails } from './call/calcSingleCallBondDetails'
import { calcSingleCallableBondDetails } from './callable/calcSingleCallBondDetails'
import { calcSingleCallableBondPoolDetails } from './callable/calcSingleCallBondPoolDetails'
import { State, Bond, DigitalBond, CallableBond, BondsState } from '../types'

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}


export const usePollBondsWithUserData = (chainId: number) => {
  const dispatch = useAppDispatch()
  const { slowRefresh, fastRefresh } = useRefresh()
  const { account, library } = useActiveWeb3React()

  const { metaLoaded } = useBonds()

  useEffect(() => {
    if (!metaLoaded) {
      const bondMeta = bondConfig(chainId)
      dispatch(fetchBondMeta({ chainId, bondMeta }))
    }
  },
    [metaLoaded, chainId, dispatch]
  )

  const { bonds } = useBonds()

  useEffect(() => {
    if (metaLoaded) {
      const bondsToFetch = Object.values(bonds[chainId].bondData)
      const callBondsToFetch = Object.values(bonds[chainId].callBondData)
      const callableBondsToFetch = Object.values(bonds[chainId].callableBondData)

      bondsToFetch.map(
        (bond) => {
          // if (!bond.publicLoaded) {
          if (bond.bondType === BondType.Vanilla) {
            if (bond.assetType === BondAssetType.PairLP) {
              dispatch(calcSingleBondDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
            if (bond.assetType === BondAssetType.StableSwapLP || bond.assetType === BondAssetType.WeightedPoolLP) {
              dispatch(calcSingleBondStableLpDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
          }
          return 0
          // }
          // return 0

        }
      )

      callBondsToFetch.map(
        (bond) => {
          // if (!bond.publicLoaded) {
          if (bond.bondType === BondType.Call) {
            if (bond.assetType === BondAssetType.PairLP) {
              dispatch(calcSingleCallBondDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
            if (bond.assetType === BondAssetType.StableSwapLP || bond.assetType === BondAssetType.WeightedPoolLP) {
              dispatch(calcSingleCallBondPoolDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
          }
          return 0
          // }
          // return 0

        }
      )

      callableBondsToFetch.map(
        (bond) => {
          // if (!bond.publicLoaded) {
          if (bond.bondType === BondType.Callable) {
            if (bond.assetType === BondAssetType.PairLP) {
              dispatch(calcSingleCallableBondDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
            if (bond.assetType === BondAssetType.StableSwapLP || bond.assetType === BondAssetType.WeightedPoolLP) {
              dispatch(calcSingleCallableBondPoolDetails({ bond, provider: library ?? simpleRpcProvider(chainId), chainId }))
            }
          }
          return 0
          // }
          // return 0

        }
      )
    }
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chainId,
      dispatch,
      library,
      fastRefresh,
      account,
      metaLoaded
    ])

  const {
    bonds: bondsAfter,
    userDataLoaded,
    userCallDataLoaded,
    userCallableDataLoaded,
    closedMarketsLoaded,
    closedNotes
  } = useBonds()

  useEffect(() => {
    if (metaLoaded) {
      // fetch user data if account provided
      if (account) {

        const vanillas = Object.values(bondsAfter[chainId].bondData)
        if (!userDataLoaded && vanillas.length > 0) {
          dispatch(fetchBondUserDataAsync({ chainId, account, bonds: vanillas }))
        }

        const digitals = Object.values(bondsAfter[chainId].callBondData)
        if (!userCallDataLoaded && digitals.length > 0) {
          dispatch(fetchCallBondUserDataAsync({ chainId, account, bonds: digitals }))
        }

        const callables = Object.values(bondsAfter[chainId].callableBondData)
        if (!userCallableDataLoaded && callables.length > 0) {
          dispatch(fetchCallableBondUserDataAsync({ chainId, account, bonds: callables }))
        }

        if (!closedMarketsLoaded && userDataLoaded && (closedNotes[chainId].callNotesClosed.length > 0 || closedNotes[chainId].vanillaNotesClosed.length > 0 || closedNotes[chainId].callableNotesClosed.length > 0)) {
          dispatch(fetchClosedBondsUserAsync({
            chainId,
            bIds: closedNotes[chainId].vanillaNotesClosed.map(no => no.marketId).filter(onlyUnique),
            bIdsC: closedNotes[chainId].callNotesClosed.map(noC => noC.marketId).filter(onlyUnique),
            bIdsCallable: closedNotes[chainId].callableNotesClosed.map(noC => noC.marketId).filter(onlyUnique)
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
      closedMarketsLoaded
    ])
}

/**
 * Fetches the "core" bond data used globally for specific chainId
 */

export const useBonds = (): BondsState => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds
}

export const useClosedVanillaMarkets = (chainId: number) => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds.bondsClosed[chainId].vanillaBondsClosed
}

export const useClosedCallMarkets = (chainId: number) => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds.bondsClosed[chainId].callBondsClosed
}


export const useClosedCallableMarkets = (chainId: number) => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds.bondsClosed[chainId].callableBondsClosed
}


export const useReserveAddressFromBondIds = (chainId: number, bondIds: number[]): string[] => {
  const bonds = useSelector((state: State) => state.bonds)
  return bondIds.map(id => bonds.bonds[chainId].bondData[id].reserveAddress[chainId])

}

export const useBondFromBondId = (bondId: number, chainId: number): Bond => {

  const bond = useSelector((state: State) => state.bonds.bonds[chainId].bondData[bondId])
  return bond
}

export const useBondFromBondIds = (bondIds: number[], chainId: number): Bond[] => {

  const bond = useSelector((state: State) => state.bonds.bonds[chainId].bondData)
  return bondIds.map(bId => bond[bId])
}


export const useCallBondFromBondId = (bondId: number, chainId: number): DigitalBond => {

  const bond = useSelector((state: State) => state.bonds.bonds[chainId].callBondData[bondId])
  return bond
}

export const useCallBondFromBondIds = (bondIds: number[], chainId: number): DigitalBond[] => {

  const bond = useSelector((state: State) => state.bonds.bonds[chainId].callBondData)
  return bondIds.map(bId => bond[bId])
}

export const useCallableBondFromBondId = (bondId: number, chainId: number): CallableBond => {

  const bond = useSelector((state: State) => state.bonds.bonds[chainId].callableBondData[bondId])
  return bond
}

export const useCallableBondFromBondIds = (bondIds: number[], chainId: number): CallableBond[] => {

  const bond = useSelector((state: State) => state.bonds.bonds[chainId].callableBondData)
  return bondIds.map(bId => bond[bId])
}


/**
 *  Returns bond user data for id
 */
export const useBondUser = (bondId: number, chainId: number) => {
  const bond = useBondFromBondId(bondId, chainId)
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
export const useCallBondUser = (bondId: number, chainId: number) => {
  const bond = useCallBondFromBondId(bondId, chainId)
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
export const useCallableBondUser = (bondId: number, chainId: number) => {
  const bond = useCallableBondFromBondId(bondId, chainId)
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
  const data = bonds.bonds[chainId].bondData
  useEffect(() => {
    if (!metaLoaded) return;
    const bondsWithIds = Object.values(data)
    bondsWithIds.map(bondWithNoPrice => {
      let price: ethers.BigNumber;
      let link: string;
      const bondType = bondWithNoPrice.assetType

      if (!bondWithNoPrice.market) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // pair LP
      if (bondType === BondAssetType.PairLP) {
        if (!bondWithNoPrice.lpData) {
          // eslint-disable-next-line no-useless-return
          return;
        }

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

      dispatch(setLpPrice({ price: price?.toString() ?? '1', bondId: bondWithNoPrice.bondId, bondType: BondType.Vanilla, chainId }))
      dispatch(setLpLink({ link, bondId: bondWithNoPrice.bondId, bondType: BondType.Vanilla, chainId }))
      // eslint-disable-next-line no-useless-return
      return;
    })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, metaLoaded, chainId, pairsLoaded, stableLoaded]
  )

  /** CALL bonds start here */
  const callData = bonds.bonds[chainId].callBondData

  useEffect(() => {
    if (!metaLoaded) return;
    const bondsWithIds = Object.values(callData)
    bondsWithIds.map(bondWithNoPrice => {
      let price: ethers.BigNumber;
      let link: string;
      const bondType = bondWithNoPrice.assetType

      // pair LP
      if (bondType === BondAssetType.PairLP) {


        if (!bondWithNoPrice.lpData) {
          // eslint-disable-next-line no-useless-return
          return;
        }
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

      dispatch(setLpPrice({ price: price?.toString() ?? '1', bondId: bondWithNoPrice.bondId, bondType: BondType.Call, chainId }))
      dispatch(setLpLink({ link, bondId: bondWithNoPrice.bondId, bondType: BondType.Call, chainId }))
      // eslint-disable-next-line no-useless-return
      return;
    })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callData, metaLoaded, chainId, pairsLoaded, stableLoaded]
  )


  /** CALL bonds start here */
  const callableData = bonds.bonds[chainId].callableBondData

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

      dispatch(setLpPrice({ price: price?.toString() ?? '1', bondId: bondWithNoPrice.bondId, bondType: BondType.Callable, chainId }))
      dispatch(setLpLink({ link, bondId: bondWithNoPrice.bondId, bondType: BondType.Callable, chainId }))
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

export const usePriceNetworkCCYUsd = (chainId: number): BigNumber => {
  const bnbUsdBond = useBondFromBondId(1, chainId)
  return new BigNumber(3243) // new BigNumber(bnbUsdBond.quoteToken.busdPrice)
}


export const usePriceNetworkDollar = (chainId: number): BigNumber => {
  const networkDollarBond = useBondFromBondId(1, chainId)
  return new BigNumber(806) // new BigNumber(networkDollarBond.quoteToken.busdPrice)
}


export const usePriceRequiemDollar = (chainId: number): BigNumber => {
  const requiemDollarBond = useBondFromBondId(251, chainId)

  const requiemPriceDollarAsString = '1.321' // requiemDollarBond.token.busdPrice

  const reqtPriceUsd = useMemo(() => {
    return new BigNumber(requiemPriceDollarAsString)
  }, [requiemPriceDollarAsString])

  return reqtPriceUsd
}