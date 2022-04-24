import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'
import { fetchGovernanceData } from './fetchGovernanceData'
import { typeInput, typeInputTime } from './actions'
import { AppDispatch, AppState, useAppDispatch } from '../index'


export function useGovernanceState(chainId: number) {
    const state = useSelector<AppState, AppState['governance']>((_state) => _state.governance)
    return state.data[chainId]
}

export function useGovernanceActionHandlers(): {
    onCurrencyInput: (typedValue: string) => void
    onTimeInput: (typedTime: string) => void
} {
    const dispatch = useDispatch<AppDispatch>()

    const onCurrencyInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInput({ typedValue }))
        },
        [dispatch],
    )
    const onTimeInput = useCallback(
        (typedTime: string) => {
            dispatch(typeInputTime({ typedTime }))
        },
        [dispatch],
    )


    return {
        onCurrencyInput,
        onTimeInput
    }
}

export function useGovernanceInfo(
    chainId: number,
    account: string
    // this is input from the balances state
): {
    dataLoaded: boolean
    balance: string
    locks: {
        [end: number]: {
            amount: string
            end: number
            minted: string
            multiplier: string
        }
    }
    staked: string
} {
    const { dataLoaded } = useGovernanceState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh } = useRefresh()

    useEffect(() => {
        if (!dataLoaded && account) {
            dispatch(fetchGovernanceData({ chainId, account }))
        }

    }, [account, chainId, dataLoaded, slowRefresh, dispatch])

    const { balance, locks, staked } = useGovernanceState(chainId)

    return {
        dataLoaded,
        balance,
        locks,
        staked
    }
}