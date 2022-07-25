import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'

import { oracleConfig } from 'config/constants/oracles'

import { AppState, useAppDispatch } from 'state'
import { fetchBandOracleData, fetchChainLinkOracleDataFromBond, Oracle, OracleData } from './reducer'
import { setChainIdOracles } from './actions'

const bondOracles = oracleConfig

export function useOracleState() {
    const state = useSelector<AppState, AppState['oracles']>((_state) => _state.oracles)
    return state
}

export function useOracles(
    chainId: number
): {
    chainLinkLoaded: boolean
    bandLoaded: boolean
    oracles: { [key: string]: OracleData }
} {
    const dispatch = useAppDispatch()
    const { referenceChainId } = useOracleState()

    useEffect(() => {
        if (referenceChainId !== chainId) {
            dispatch(setChainIdOracles({ newChainId: chainId }))
        }
    },
        [referenceChainId, chainId, dispatch]
    )
    const { chainLinkLoaded, bandLoaded } = useOracleState()
    const { slowRefresh } = useRefresh()

    useEffect(() => {
        if (chainId === referenceChainId) {
            if (chainId === 43113)
                dispatch(fetchChainLinkOracleDataFromBond({ chainId, oracleAddresses: bondOracles[chainId].map(cfg => cfg.address), oracleType: Oracle.ChainLink }))

            if (chainId === 42261) {
                const oracleAddress = bondOracles[chainId][0].address
                dispatch(fetchBandOracleData({ chainId, callParams: bondOracles[chainId].map(cfg => { return { asset: cfg.token, quote: cfg.quote } }), oracleType: Oracle.Band, oracleAddress }))
            }
        }
    },
        [chainId, referenceChainId, slowRefresh, dispatch]
    )

    const { oracles } = useOracleState()

    return {
        chainLinkLoaded,
        bandLoaded,
        oracles: chainId === 43113 ? oracles[43113].chainLink : oracles[42261].band
    }
}


export function useGetOracle(
    chainId: number,
    asset: string,
    quote?: string
): OracleData {
    const { chainLinkLoaded, bandLoaded, oracles } = useOracles(chainId)

    if (chainId === 43113) return oracles[asset]

    if (chainId === 42261 && quote) return oracles[`${asset}-${quote}`]

    return null
}

