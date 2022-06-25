import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'

import { oracleConfig } from 'config/constants/oracles'

import { AppDispatch, AppState, useAppDispatch } from '../index'
import { fetchOracleDataFromBond, OracleData } from './reducer'

const bondOracles = oracleConfig

export function useOracleState(chainId: number) {
    const state = useSelector<AppState, AppState['oracles']>((_state) => _state.oracles)
    return state.data[chainId]
}

export function useOracles(
    chainId: number
): {
    dataLoaded: boolean
    oracles: { [address: string]: OracleData }
} {
    const { dataLoaded } = useOracleState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh } = useRefresh()

    useEffect(() => {
        dispatch(fetchOracleDataFromBond({ chainId, oracleAddresses: Object.keys(bondOracles[chainId]) }))

    }, [chainId, slowRefresh, dispatch])

    const { oracles } = useOracleState(chainId)

    return {
        dataLoaded,
        oracles
    }
}