import { Currency, CurrencyAmount, JSBI, NETWORK_CCY, WeightedPair, Percent, Price, TokenAmount, Pair } from '@requiemswap/sdk'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'
import { fetchStakingData } from './fetchStakingData'
import { typeInput, typeInputTime } from './actions'
import { AppDispatch, AppState, useAppDispatch } from '../index'
import { tryParseAmount, tryParseTokenAmount } from '../swapV3/hooks'
import { Epoch, StakeData } from './reducer'


const ZERO = JSBI.BigInt(0)

export function useAssetBackedStakingState(chainId: number) {
    const state = useSelector<AppState, AppState['assetBackedStaking']>((_state) => _state.assetBackedStaking)
    return state.staking[chainId]
}


export function useAssetBackedStakingInfo(
    chainId: number,
    account: string
    // this is input from the balances state
): {
    epoch: Epoch
    generalDataLoaded: boolean
    stakeData: StakeData
} {
    const { dataLoaded } = useAssetBackedStakingState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh } = useRefresh()

    useEffect(() => {
        if (!dataLoaded) {
            dispatch(fetchStakingData({ chainId }))
        }

    }, [chainId, dataLoaded, slowRefresh, dispatch])

    const { epoch, stakeData } = useAssetBackedStakingState(chainId)


    return {
        epoch,
        stakeData,
        generalDataLoaded: dataLoaded
    }
}