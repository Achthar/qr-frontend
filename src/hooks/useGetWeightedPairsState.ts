import { nanoid } from '@reduxjs/toolkit'
// import { ChainId } from '@requiemswap/sdk'
import { TokenList } from '@uniswap/token-lists'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { TokenPair } from 'config/constants/types'
import { deserializeWeightedPair } from 'utils/bondUtils'
import { useDeserializedWeightedPairs, useDeserializedWeightedPairsAndLpBalances, useDeserializedWeightedPairsData, usePairIsInState, useSerializedWeightedPairsData, useWeightedPairsState } from 'state/weightedPairs/hooks'
import { addTokenPair, changeChainIdWeighted, setMetdataLoaded } from 'state/weightedPairs/actions'
import { fetchWeightedPairMetaData, isNewTokenPair } from 'state/weightedPairs/fetchWeightedPairMetaData'
import { fetchWeightedPairData, fetchWeightedPairReserves, fetchWeightedPairUserData, reduceDataFromDict } from 'state/weightedPairs/fetchWeightedPairData'
import { Currency, TokenAmount, AmplifiedWeightedPair } from '@requiemswap/sdk'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { serializeToken } from 'state/user/hooks/helpers'

import { SerializedWeightedPair } from 'state/types'
import { AppDispatch, useAppDispatch } from '../state'


// that function is  supposed to remove duplicate token pairs
// assumes that the pair is already ordered by addresses of tokens
export const cleanTokenPairs = (additionalTokens: TokenPair[], referenceTokens: TokenPair[]): TokenPair[] => {
    if (additionalTokens.length === 0)
        return referenceTokens

    const newPairs = []
    for (let i = 0; i < additionalTokens.length; i++) {
        let pairNew = false
        for (let j = 0; j < referenceTokens.length; j++) {
            if (additionalTokens[i].token0.address !== referenceTokens[j].token0.address &&
                additionalTokens[i].token1.address !== referenceTokens[j].token1.address) {
                pairNew = true
                break;
            }
        }
        newPairs.push(additionalTokens[i])
    }
    return [...newPairs, ...referenceTokens]
}

export function useGetWeightedPairsState(
    chainId: number,
    account: string,
    additionalTokenPairs: TokenPair[],
    refreshGeneral: number,
    refreshUser: number
): {
    pairs: AmplifiedWeightedPair[]
    balances: TokenAmount[]
    totalSupply: TokenAmount[]
    metaDataLoaded: boolean,
    reservesAndWeightsLoaded: boolean,
    userBalancesLoaded: boolean
} {
    const dispatch = useAppDispatch()


    const {
        referenceChain
    } = useWeightedPairsState(chainId ?? 43113)

    // a chainId change should reset everything
    useEffect(() => {
        if (referenceChain !== chainId) {
            dispatch(changeChainIdWeighted({ newChainId: chainId }))
        }
    },
        [dispatch, referenceChain, chainId]
    )

    const {
        tokenPairs,
        metaDataLoaded,
        weightedPairMeta,
        userBalancesLoaded
    } = useWeightedPairsState(chainId)

    // metatedata is supposed to be fetched once
    // actions in the reducer allow a re-trigger of the metaData fetch
    // by setting metaDataLoaded to false
    useEffect(() => {
        if (!metaDataLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairMetaData({ chainId, tokenPairs: cleanTokenPairs(additionalTokenPairs, tokenPairs) }))
        }

    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshGeneral, metaDataLoaded, referenceChain, chainId, additionalTokenPairs]
    )


    const {
        reservesAndWeightsLoaded
    } = useWeightedPairsState(chainId)

    // reserves are fetched in cycles
    // weights and fee should be separated from reserves later on
    useEffect(() => {
        if (metaDataLoaded && !reservesAndWeightsLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        [dispatch, metaDataLoaded, chainId, weightedPairMeta, reservesAndWeightsLoaded, referenceChain, refreshGeneral]
    )

    const {
        weightedPairs
    } = useWeightedPairsState(chainId)

    // use reduced data (to addresses) for next input
    const pairData = useMemo(() => {
        if (metaDataLoaded) {
            return reduceDataFromDict(weightedPairs)
        }
        return {}
    },
        [weightedPairs, metaDataLoaded]
    )

    // fetch balances and total supply 
    // the dependency on the reduced data has to be removed, otherwise it re-loads way to often
    useEffect(() => {
        if (metaDataLoaded && reservesAndWeightsLoaded && account && referenceChain === chainId && Object.values(pairData)) {
            dispatch(fetchWeightedPairUserData({ chainId, account, pairData }))
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshUser, metaDataLoaded, chainId, reservesAndWeightsLoaded, account, userBalancesLoaded, referenceChain]
    )

    // finally we get all data as class objects in arrays to be used in the respective views
    const { pairs: allWeightedPairs, balances, totalSupply } = useDeserializedWeightedPairsAndLpBalances(chainId)


    return {
        pairs: allWeightedPairs,
        balances,
        totalSupply,
        metaDataLoaded,
        reservesAndWeightsLoaded,
        userBalancesLoaded
    }
}



/** Hook for trading section
 * - the main difference to the other hooks is that it does not load user data in its cycles
 */
export function useGetWeightedPairsTradeState(
    chainId: number,
    additionalTokenPairs: TokenPair[],
    refreshGeneral: number
): {
    pairs: AmplifiedWeightedPair[]
    metaDataLoaded: boolean,
    reservesAndWeightsLoaded: boolean
} {
    const dispatch = useAppDispatch()


    const {
        referenceChain
    } = useWeightedPairsState(chainId ?? 43113)

    // a chainId change should reset everything
    useEffect(() => {
        if (referenceChain !== chainId) {
            dispatch(changeChainIdWeighted({ newChainId: chainId }))
        }
    },
        [dispatch, referenceChain, chainId]
    )

    const {
        metaDataLoaded,
        reservesAndWeightsLoaded,
        tokenPairs,
        userBalancesLoaded
    } = useWeightedPairsState(chainId)

    // set matadata loaded to false if new pairs included
    useEffect(() => {
        if (additionalTokenPairs.length > tokenPairs.length) {
            dispatch(setMetdataLoaded())
        }
    })

    // metatedata is supposed to be fetched once
    // actions in the reducer allow a re-trigger of the metaData fetch
    // by setting metaDataLoaded to false
    useEffect(() => {
        if (!metaDataLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairMetaData({ chainId, tokenPairs: additionalTokenPairs }))
        }

    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshGeneral, metaDataLoaded, referenceChain, chainId]
    )


    const {
        weightedPairMeta,
    } = useWeightedPairsState(chainId)

    // reserves are fetched in cycles
    // weights and fee should be separated from reserves later on
    useEffect(() => {
        if (metaDataLoaded && !reservesAndWeightsLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, metaDataLoaded, chainId, reservesAndWeightsLoaded, referenceChain]
    )

    // reserves are fetched in cycles
    // refreshes reserves only
    useEffect(() => {
        if (metaDataLoaded && reservesAndWeightsLoaded && reservesAndWeightsLoaded) {
            dispatch(fetchWeightedPairReserves({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshGeneral]
    )

    // finally we get all pairs as class objects in an array 
    const { pairs } = useDeserializedWeightedPairsData(chainId)

    return {
        pairs,
        metaDataLoaded,
        reservesAndWeightsLoaded
    }
}

export function useAddPair(currencyA: Currency, currencyB: Currency, chainId: number): boolean {

    const [tokenA, tokenB] = chainId
        ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
        : [undefined, undefined]

    const tokenPair = tokenA && tokenB ? (tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? {
        token0: serializeToken(tokenA),
        token1: serializeToken(tokenB)
    } : {
        token0: serializeToken(tokenB),
        token1: serializeToken(tokenA)
    }) : null

    const pairContained = usePairIsInState(chainId, tokenPair)

    const dispatch = useDispatch<AppDispatch>()
    useEffect(() => {
        if (!pairContained) {
            dispatch(addTokenPair({ tokenPair }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairContained, tokenPair])

    return pairContained
}


export function useTokenPair(currencyA: Currency, currencyB: Currency, chainId: number): TokenPair {

    const [tokenA, tokenB] = chainId
        ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
        : [undefined, undefined]

    const tokenPair = tokenA && tokenB ? (tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? {
        token0: serializeToken(tokenA),
        token1: serializeToken(tokenB)
    } : {
        token0: serializeToken(tokenB),
        token1: serializeToken(tokenA)
    }) : null


    return tokenPair
}



/** Hook for simple pricings
 * - the main difference to the other hooks is that it does not load user data in its cycles
 * - additionally it just uses a simplified approach for pricings
 */
export function useGetWeightedPairsPricerState(
    chainId: number,
    refreshGeneral: number
): {
    pairs: AmplifiedWeightedPair[]
    metaDataLoaded: boolean,
    reservesAndWeightsLoaded: boolean
} {
    const dispatch = useAppDispatch()


    const {
        referenceChain
    } = useWeightedPairsState(chainId ?? 43113)

    // a chainId change should reset everything
    useEffect(() => {
        if (referenceChain !== chainId) {
            dispatch(changeChainIdWeighted({ newChainId: chainId }))
        }
    },
        [dispatch, referenceChain, chainId]
    )

    const {
        metaDataLoaded,
        reservesAndWeightsLoaded,
    } = useWeightedPairsState(chainId)

    // metatedata is supposed to be fetched once
    // actions in the reducer allow a re-trigger of the metaData fetch
    // by setting metaDataLoaded to false
    useEffect(() => {
        if (!metaDataLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairMetaData({ chainId }))
        }

    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshGeneral, metaDataLoaded, referenceChain, chainId]
    )


    const {
        weightedPairMeta,
    } = useWeightedPairsState(chainId)

    // reserves are fetched in cycles
    // weights and fee should be separated from reserves later on
    useEffect(() => {
        if (metaDataLoaded && !reservesAndWeightsLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, metaDataLoaded, chainId, reservesAndWeightsLoaded, referenceChain]
    )

    // reserves are fetched in cycles
    // refreshes reserves only
    useEffect(() => {
        if (metaDataLoaded && reservesAndWeightsLoaded && reservesAndWeightsLoaded) {
            dispatch(fetchWeightedPairReserves({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshGeneral]
    )

    // finally, we get the weighted pairs
    const {
        weightedPairs
    } = useWeightedPairsState(chainId)

    // we select the pairs with the highest total supply of LP
    const addressKeys = Object.keys(weightedPairs).sort()
    const pairs = []
    for (let i = 0; i < addressKeys.length; i++) {
        const pair = deserializeWeightedPair(Object.values(weightedPairs[addressKeys[i]]).reduce((prev, current) => (prev.totalSupply > current.totalSupply) ? prev : current))
        pairs.push(pair)
    }

    return {
        pairs,
        metaDataLoaded,
        reservesAndWeightsLoaded
    }
}



export function useGetRawWeightedPairsState(
    chainId: number,
    account: string,
    additionalTokenPairs: TokenPair[],
    refreshGeneral: number,
): {
    pairs: { [key1: string]: { [key2: string]: SerializedWeightedPair } }
    metaDataLoaded: boolean,
    reservesAndWeightsLoaded: boolean,
} {
    const dispatch = useAppDispatch()

    const {
        referenceChain
    } = useWeightedPairsState(chainId ?? 43113)

    // a chainId change should reset everything
    useEffect(() => {
        if (referenceChain !== chainId) {
            dispatch(changeChainIdWeighted({ newChainId: chainId }))
        }
    },
        [dispatch, referenceChain, chainId]
    )

    const {
        metaDataLoaded,
        tokenPairs,
        weightedPairMeta,
        reservesAndWeightsLoaded
    } = useWeightedPairsState(chainId)

    // metatedata is supposed to be fetched once
    // actions in the reducer allow a re-trigger of the metaData fetch
    // by setting metaDataLoaded to false
    useEffect(() => {
        if (!metaDataLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairMetaData({ chainId, tokenPairs: cleanTokenPairs(additionalTokenPairs, tokenPairs) }))
        }

    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshGeneral, metaDataLoaded, referenceChain, chainId, additionalTokenPairs]
    )


    // reserves are fetched in cycles
    // weights and fee should be separated from reserves later on
    useEffect(() => {
        if (metaDataLoaded && !reservesAndWeightsLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        [dispatch, metaDataLoaded, chainId, weightedPairMeta, reservesAndWeightsLoaded, referenceChain, refreshGeneral]
    )

    const {
        weightedPairs
    } = useWeightedPairsState(chainId)

    // use reduced data (to addresses) for next input
    const pairData = useMemo(() => {
        if (metaDataLoaded) {
            return reduceDataFromDict(weightedPairs)
        }
        return {}
    },
        [weightedPairs, metaDataLoaded]
    )

    // finally we get all data as class objects in arrays to be used in the respective views
    const { pairs: allWeightedPairs } = useSerializedWeightedPairsData(chainId)

    return {
        pairs: allWeightedPairs,
        metaDataLoaded,
        reservesAndWeightsLoaded
    }
}

export function useWeightedPairRefresh(
    chainId: number
): void {
    const dispatch = useAppDispatch()

    const {
        weightedPairMeta,
    } = useWeightedPairsState(chainId)


    dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))

}
