import { nanoid } from '@reduxjs/toolkit'
// import { ChainId } from '@requiemswap/sdk'
import { TokenList } from '@uniswap/token-lists'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { TokenPair } from 'config/constants/types'
import { useDeserializedWeightedPairs, useDeserializedWeightedPairsAndLpBalances, useDeserializedWeightedPairsData, usePairIsInState, useWeightedPairsState } from 'state/weightedPairs/hooks'
import { addTokenPair, changeChainIdWeighted } from 'state/weightedPairs/actions'
import { fetchWeightedPairMetaData, isNewTokenPair } from 'state/weightedPairs/fetchWeightedPairMetaData'
import { fetchWeightedPairData, fetchWeightedPairReserves, fetchWeightedPairUserData, reduceDataFromDict } from 'state/weightedPairs/fetchWeightedPairData'
import { Currency, TokenAmount, WeightedPair } from '@requiemswap/sdk'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { serializeToken } from 'state/user/hooks/helpers'
import { AppDispatch } from '../state'

export function useGetWeightedPairsState(
    chainId: number,
    account: string,
    additionalTokenPairs: TokenPair[],
    refreshGeneral: number,
    refreshUser: number
): {
    pairs: WeightedPair[]
    balances: TokenAmount[]
    totalSupply: TokenAmount[]
    metaDataLoaded: boolean,
    reservesAndWeightsLoaded: boolean,
    userBalancesLoaded: boolean
} {
    const dispatch = useDispatch<AppDispatch>()


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
        weightedPairMeta,
        reservesAndWeightsLoaded,
        userBalancesLoaded
    } = useWeightedPairsState(chainId)

    // metatedata is supposed to be fetched once
    // actions in the reducer allow a re-trigger of the metaData fetch
    // by setting metaDataLoaded to false
    useEffect(() => {
        if (!metaDataLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairMetaData({ chainId, additionalTokens: additionalTokenPairs }))
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
    pairs: WeightedPair[]
    metaDataLoaded: boolean,
    reservesAndWeightsLoaded: boolean
} {
    const dispatch = useDispatch<AppDispatch>()


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
        weightedPairMeta,
        reservesAndWeightsLoaded,
        userBalancesLoaded
    } = useWeightedPairsState(chainId)

    // metatedata is supposed to be fetched once
    // actions in the reducer allow a re-trigger of the metaData fetch
    // by setting metaDataLoaded to false
    useEffect(() => {
        if (!metaDataLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairMetaData({ chainId, additionalTokens: additionalTokenPairs }))
        }

    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshGeneral, metaDataLoaded, referenceChain, chainId]
    )


    // reserves are fetched in cycles
    // weights and fee should be separated from reserves later on
    useEffect(() => {
        if (metaDataLoaded && !reservesAndWeightsLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        [dispatch, metaDataLoaded, chainId, weightedPairMeta, reservesAndWeightsLoaded, referenceChain]
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
    }, [pairContained])

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
