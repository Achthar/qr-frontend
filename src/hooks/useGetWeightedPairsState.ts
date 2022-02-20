import { nanoid } from '@reduxjs/toolkit'
// import { ChainId } from '@requiemswap/sdk'
import { TokenList } from '@uniswap/token-lists'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { TokenPair } from 'config/constants/types'
import { useDeserializedWeightedPairsAndLpBalances, useWeightedPairsState } from 'state/weightedPairs/hooks'
import { changeChainIdWeighted } from 'state/weightedPairs/actions'
import { fetchWeightedPairMetaData, isNewTokenPair } from 'state/weightedPairs/fetchWeightedPairMetaData'
import { fetchWeightedPairData, fetchWeightedPairUserData, reduceDataFromDict } from 'state/weightedPairs/fetchWeightedPairData'
import { TokenAmount, WeightedPair } from '@requiemswap/sdk'
import { AppDispatch } from '../state'

export function useGetWeightedPairsState(
    chainId: number, 
    account: string, 
    additionalTokenPairs: TokenPair[], 
    refreshGeneral: number, 
    refreshUser:number
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
    } = useWeightedPairsState()

    console.log("WP: CID", chainId, referenceChain)
    //  metatedata is supposed to be fetched once
    useEffect(() => {
        if (referenceChain !== chainId) {
            console.log("WP HERE:", chainId, referenceChain)
            dispatch(changeChainIdWeighted({ newChainId: chainId }))
        }

    },
        [dispatch, referenceChain, chainId]
    )

    const {
        tokenPairs,
        metaDataLoaded,
        weightedPairMeta,
        reservesAndWeightsLoaded,
        userBalancesLoaded
    } = useWeightedPairsState()

    console.log("WP: CID2", chainId, referenceChain, "TP", tokenPairs[0])
    //  metatedata is supposed to be fetched once
    useEffect(() => {
        if (!metaDataLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairMetaData({ chainId, additionalTokens: additionalTokenPairs }))
        }

    },
        [dispatch, refreshGeneral, tokenPairs, metaDataLoaded, referenceChain, chainId, additionalTokenPairs]
    )


    console.log("WP MD", weightedPairMeta)
    // reserves are fetched only once
    useEffect(() => {
        if (metaDataLoaded && !reservesAndWeightsLoaded && referenceChain === chainId) {
            dispatch(fetchWeightedPairData({ chainId, pairMetaData: weightedPairMeta }))
        }
    },
        [dispatch, metaDataLoaded, chainId, weightedPairMeta, reservesAndWeightsLoaded, referenceChain, refreshGeneral]
    )

    const {
        weightedPairs
    } = useWeightedPairsState()
    // use reduced data for next input
    const pairData = useMemo(() => {
        if (metaDataLoaded) {
            console.log("WPAIR USER CHANGE")
            return reduceDataFromDict(weightedPairs)
        }
        return {}
    },
        [weightedPairs, metaDataLoaded]
    )

    // fetch balances
    useEffect(() => {
        if (metaDataLoaded && reservesAndWeightsLoaded && account && referenceChain === chainId && Object.values(pairData)) {
            dispatch(fetchWeightedPairUserData({ chainId, account, pairData }))
        }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, refreshUser, metaDataLoaded, chainId, reservesAndWeightsLoaded, account, userBalancesLoaded, referenceChain]
    )

    const { pairs: allWeightedPairs, balances, totalSupply } = useDeserializedWeightedPairsAndLpBalances()

    return {
        pairs: allWeightedPairs,
        balances,
        totalSupply,
        metaDataLoaded,
        reservesAndWeightsLoaded,
        userBalancesLoaded
    }
}
