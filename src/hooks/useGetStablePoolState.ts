import { useCallback, useEffect, useMemo } from 'react'
import { StablePool, TokenAmount } from '@requiemswap/sdk'
import { useDeserializedStablePools, useStablePoolReferenceChain, useStablePools } from 'state/stablePools/hooks'
import { fetchStablePoolData } from 'state/stablePools/fetchStablePoolData'
import { fetchStablePoolUserDataAsync } from 'state/stablePools'
import { getAmountsForSerializedTokens, useUserBalances } from 'state/user/hooks'
import { changeChainIdStables } from 'state/stablePools/actions'
import { AppDispatch, useAppDispatch } from '../state'

export function useGetStablePoolState(
    chainId: number,
    account: string,
    refreshGeneral: number,
    refreshUser: number
): {
    stablePools: StablePool[]
    stableAmounts: TokenAmount[]
    publicDataLoaded: boolean,
    userDataLoaded: boolean
} {

    const dispatch = useAppDispatch()

    const referenceChain = useStablePoolReferenceChain()

    useEffect(() => {
        if (chainId !== referenceChain) {
            dispatch(changeChainIdStables({ newChainId: chainId }))
        }
    }, [referenceChain, chainId, dispatch])

    const { pools, publicDataLoaded, userDataLoaded } = useStablePools(chainId)
    useEffect(
        () => {
            if (!publicDataLoaded) {
                Object.values(pools).map(
                    (pool) => {
                        dispatch(fetchStablePoolData({ pool, chainId }))

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
            dispatch(fetchStablePoolUserDataAsync({ chainId, account, pools }))
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


    const deserializedPools = useDeserializedStablePools(chainId)
    //   const stablePool = deserializedPools[0]

    const {
        balances: allBalances,
        isLoadingTokens,
    } = useUserBalances(chainId)


    const stableAmounts = useMemo(() =>
        getAmountsForSerializedTokens(pools[0]?.tokens, allBalances),
        [pools, allBalances]
    )



    return {
        stablePools: deserializedPools,
        stableAmounts,
        publicDataLoaded,
        userDataLoaded
    }
}
