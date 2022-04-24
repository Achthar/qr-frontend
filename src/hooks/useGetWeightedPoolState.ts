import { useCallback, useEffect, useMemo } from 'react'
import { StablePool, TokenAmount, WeightedPool } from '@requiemswap/sdk'
import { useDeserializedWeightedPools, useWeightedPools, useWeightedPoolReferenceChain } from 'state/weightedPools/hooks'
import { fetchWeightedPoolUserDataAsync } from 'state/weightedPools'
import { changeChainIdWeighted } from 'state/weightedPools/actions'
import { fetchWeightedPoolData } from 'state/weightedPools/fetchWeightedPoolData'
import { AppDispatch, useAppDispatch } from '../state'


export function useGetWeightedPoolState(
    chainId: number,
    account: string,
    refreshGeneral: number,
    refreshUser: number
): {
    weightedPools: WeightedPool[]
    // tokenAmounts: TokenAmount[]
    publicDataLoaded: boolean,
    userDataLoaded: boolean
} {

    const dispatch = useAppDispatch()

    const referenceChain = useWeightedPoolReferenceChain()

    useEffect(() => {
        if (chainId !== referenceChain) {
            dispatch(changeChainIdWeighted({ newChainId: chainId }))
        }
    }, [referenceChain, chainId, dispatch])

    const { pools, publicDataLoaded, userDataLoaded } = useWeightedPools(chainId)
    useEffect(
        () => {
            if (!publicDataLoaded) {
                Object.values(pools).map(
                    (pool) => {
                        dispatch(fetchWeightedPoolData({ pool, chainId }))

                        return 0
                    }
                )
            }

        },
        [
            chainId,
            dispatch,
            refreshGeneral,
            pools,
            publicDataLoaded
        ])

    useEffect(() => {
        if (account && !userDataLoaded && publicDataLoaded) {
            dispatch(fetchWeightedPoolUserDataAsync({ chainId, account, pools }))
        }
    },
        [
            account,
            chainId,
            pools,
            userDataLoaded,
            publicDataLoaded,
            refreshUser,
            dispatch
        ]
    )


    const deserializedPools = useDeserializedWeightedPools(chainId)
    //   const stablePool = deserializedPools[0]

    // const {
    //     balances: allBalances,
    //     isLoadingTokens,
    // } = useUserBalances(chainId)


    // const stableAmounts = useMemo(() =>
    //     getStableAmounts(chainId, allBalances),
    //     [chainId, allBalances]
    // )



    return {
        weightedPools: deserializedPools,
        publicDataLoaded,
        userDataLoaded
    }
}
