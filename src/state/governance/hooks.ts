import { Currency, CurrencyAmount, JSBI, NETWORK_CCY, WeightedPair, Percent, Price, TokenAmount, Pair } from '@requiemswap/sdk'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'
import { fetchGovernanceDetails } from './fetchGovernanceDetails'
import { typeInput, typeInputTime } from './actions'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount, tryParseTokenAmount } from '../swapV3/hooks'


const ZERO = JSBI.BigInt(0)

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

} {
    const { dataLoaded } = useGovernanceState(chainId)

    const dispatch = useDispatch<AppDispatch>()

    const { slowRefresh } = useRefresh()

    useEffect(() => {
        if (!dataLoaded) {
            dispatch(fetchGovernanceDetails({ chainId, account }))
        }

    })

    const { balance, lock, staked } = useGovernanceState(chainId)

    return {
        balance,
        lock,
        staked
    }
}