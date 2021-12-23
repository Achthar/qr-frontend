import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { BIG_ZERO } from 'utils/bigNumber'
import { getBalanceAmount } from 'utils/formatBalance'
import { bondsConfig as bondsDict } from 'config/constants'
import { useWeightedPairs, WeightedPairState } from 'hooks/useWeightedPairs'
import { Price, TokenAmount } from '@requiemswap/sdk'
import { DAI, REQT } from 'config/constants/tokens'
import useRefresh from 'hooks/useRefresh'
import { fetchBondsPublicDataAsync, fetchBondUserDataAsync, nonArchivedBonds } from '.'
import { State, Bond, BondsState } from '../types'


export const usePollBondsPublicData = (chainId: number, includeArchive = false) => {
  const dispatch = useAppDispatch()
  const { slowRefresh } = useRefresh()

  useEffect(() => {
    const bondsToFetch = includeArchive ? bondsDict[chainId ?? 43113] : nonArchivedBonds(chainId ?? 43113)
    console.log(bondsToFetch)
    const bondIds = bondsToFetch.map((bondToFetch) => bondToFetch.bondId)
    dispatch(fetchBondsPublicDataAsync(bondIds))
  }, [includeArchive, dispatch, slowRefresh, chainId])
}

export const usePollBondsWithUserData = (chainId: number, includeArchive = false) => {
  const dispatch = useAppDispatch()
  const { slowRefresh } = useRefresh()
  const { account } = useWeb3React()

  useEffect(() => {
    const bondsToFetch = includeArchive ? bondsDict[chainId] : nonArchivedBonds(chainId)
    const bondIds = bondsToFetch.map((bondToFetch) => bondToFetch.bondId)

    dispatch(fetchBondsPublicDataAsync(bondIds))

    if (account) {
      dispatch(fetchBondUserDataAsync({ account, bondIds }))
    }
  }, [chainId, includeArchive, dispatch, slowRefresh, account])
}

/**
 * Fetches the "core" bond data used globally
 */
export const usePollCoreBondData = () => {
  const dispatch = useAppDispatch()
  const { fastRefresh } = useRefresh()

  useEffect(() => {
    dispatch(fetchBondsPublicDataAsync([0]))
  }, [dispatch, fastRefresh])
}

export const useBonds = (): BondsState => {
  const bonds = useSelector((state: State) => state.bonds)
  return bonds
}

export const useBondFromBondId = (bondId): Bond => {
  console.log()
  const bond = useSelector((state: State) => state.bonds.data.find((f) => f.bondId === bondId))
  return bond
}

export const useBondFromBondName = (name: string): Bond => {
  const bond = useSelector((state: State) => state.bonds.data.find((f) => f.name === name))
  return bond
}

export const useBondUser = (bondId) => {
  const bond = useBondFromBondId(bondId)

  return {
    allowance: bond.userData ? new BigNumber(bond.userData.allowance) : BIG_ZERO,
    tokenBalance: bond.userData ? new BigNumber(bond.userData.tokenBalance) : BIG_ZERO,
    stakedBalance: bond.userData ? new BigNumber(bond.userData.stakedBalance) : BIG_ZERO,
    earnings: bond.userData ? new BigNumber(bond.userData.earnings) : BIG_ZERO,
  }
}

// Return the base token price for a bond, from a given bondId
export const useUsdPriceFromBondId = (bondId: number): BigNumber => {
  const bond = useBondFromBondId(bondId)
  return bond && new BigNumber(12) // new BigNumber(bond.token.busdPrice)
}

export const useLpTokenPrice = (symbol: string) => {
  const bond = useBondFromBondName(symbol)
  const bondTokenPriceInUsd = useUsdPriceFromBondId(bond.bondId)
  let lpTokenPrice = BIG_ZERO

  if (bond.lpTotalSupply && bond.lpTotalInQuoteToken) {
    // Total value of base token in LP
    const valueOfBaseTokenInBond = bondTokenPriceInUsd.times(bond.tokenAmountTotal)
    // Double it to get overall value in LP
    const overallValueOfAllTokensInBond = valueOfBaseTokenInBond.times(2)
    // Divide total value of all tokens, by the number of LP tokens
    const totalLpTokens = getBalanceAmount(new BigNumber(bond.lpTotalSupply))
    lpTokenPrice = overallValueOfAllTokensInBond.div(totalLpTokens)
  }

  return lpTokenPrice
}

// /!\ Deprecated , use the BUSD hook in /hooks

export const usePriceNetworkCCYUsd = (): BigNumber => {
  const bnbUsdBond = useBondFromBondId(1)
  return new BigNumber(3243) // new BigNumber(bnbUsdBond.quoteToken.busdPrice)
}

export const usePriceReqtUsd = (chainId: number): BigNumber => {
  // const reqtnetworkCCYBond = useBondFromBondId(0)
  const [pairState, pair] = useWeightedPairs([[REQT[chainId], DAI[chainId]]], [80], [25])[0]

  return useMemo(
    () => {
      const inAmount = new TokenAmount(REQT[chainId ?? 43113], '1000000000000000000')

      const [outAmount,] = pairState === WeightedPairState.EXISTS
        ? pair.clone().getOutputAmount(inAmount)
        : [new TokenAmount(DAI[chainId ?? 43113], '1'),]
      return new BigNumber(outAmount.raw.toString()) // reqtnetworkCCYBond.token.busdPrice
    },
    [chainId, pair, pairState]
  )
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
// import { useSelector } from "react-redux";
// import { useEffect, useState } from "react";
// import allBonds, { allExpiredBonds } from "src/helpers/AllBonds";
// import { IUserBondDetails } from "src/slices/AccountSlice";
// import { Bond } from "src/lib/Bond";
// import { IBondDetails } from "src/slices/BondSlice";

// interface IBondingStateView {
//   account: {
//     bonds: {
//       [key: string]: IUserBondDetails;
//     };
//   };
//   bonding: {
//     loading: Boolean;
//     [key: string]: any;
//   };
// }

// // Smash all the interfaces together to get the BondData Type
// export interface IAllBondData extends Bond, IBondDetails, IUserBondDetails {}

// const initialBondArray = allBonds;
// const initialExpiredArray = allExpiredBonds;
// // Slaps together bond data within the account & bonding states
// export function useBondsGeneric(chainId: number) {
//   const bondLoading = useSelector((state: IBondingStateView) => !state.bonding.loading);
//   const bondState = useSelector((state: IBondingStateView) => state.bonding);
//   const accountBondsState = useSelector((state: IBondingStateView) => state.account.bonds);
//   const [bonds, setBonds] = useState<Bond[] | IAllBondData[]>(initialBondArray);
//   const [expiredBonds, setExpiredBonds] = useState<Bond[] | IAllBondData[]>(initialExpiredArray);

//   useEffect(() => {
//     let bondDetails: Bond[];
//     bondDetails = allBonds
//       .flatMap(bond => {
//         if (bondState[bond.name] && bondState[bond.name].bondDiscount) {
//           return Object.assign(bond, bondState[bond.name]); // Keeps the object type
//         }
//         return bond;
//       })
//       .flatMap(bond => {
//         if (accountBondsState[bond.name]) {
//           return Object.assign(bond, accountBondsState[bond.name]);
//         }
//         return bond;
//       });

//     const mostProfitableBonds = bondDetails.concat().sort((a, b) => {
//       if (!getBondability(chainId, a)) return 1;
//       if (!getBondability(chainId, b)) return -1;
//       return a["bondDiscount"] > b["bondDiscount"] ? -1 : b["bondDiscount"] > a["bondDiscount"] ? 1 : 0;
//     });
//     setBonds(mostProfitableBonds);

//     // TODO (appleseed-expiredBonds): there may be a smarter way to refactor this
//     let expiredDetails: IAllBondData[];
//     expiredDetails = allExpiredBonds
//       .flatMap(bond => {
//         if (bondState[bond.name] && bondState[bond.name].bondDiscount) {
//           return Object.assign(bond, bondState[bond.name]); // Keeps the object type
//         }
//         return bond;
//       })
//       .flatMap(bond => {
//         if (accountBondsState[bond.name]) {
//           return Object.assign(bond, accountBondsState[bond.name]);
//         }
//         return bond;
//       });
//     setExpiredBonds(expiredDetails);
//   }, [bondState, accountBondsState, bondLoading]);

//   // Debug Log:
//   // console.log(bonds);
//   return { bonds, loading: bondLoading, expiredBonds };
// }

function getBondability(chainId: number, bond: Bond) {
  return bond.isBondable[chainId];
}

// export default useBonds;
