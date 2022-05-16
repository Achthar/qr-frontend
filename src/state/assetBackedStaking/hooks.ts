
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'
import { fetchStakingData } from './fetchStakingData'
import { typeInput, typeInputTime } from './actions'
import { AppDispatch, AppState, useAppDispatch } from '../index'
import { tryParseAmount, tryParseTokenAmount } from '../swapV3/hooks'
import { Epoch, StakeData, StakedRequiem, UserData } from './reducer'
import { fetchStakingUserData } from './fetchStakingUserData'
import { fetchTokenData } from './fetchTokenData'


export function useAssetBackedStakingState(chainId: number) {
    const state = useSelector<AppState, AppState['assetBackedStaking']>((_state) => _state.assetBackedStaking)
    return state.staking[chainId]
}

export function useAssetBackedStakingStateUser(chainId: number) {
    const state = useSelector<AppState, AppState['assetBackedStaking']>((_state) => _state.assetBackedStaking)
    return { userData: state.staking[chainId]?.userData, userDataLoaded: state.staking[chainId].userDataLoaded }
}

export function useStakedRequiem(chainId: number) {
    const state = useSelector<AppState, AppState['assetBackedStaking']>((_state) => _state.assetBackedStaking)
    return { stakedRequiem: state.staking[chainId]?.stakedRequiem, stakedRequiemLoaded: state.staking[chainId].stakedReqLoaded }
}

export function useAssetStakingUser(chainId: number) {
    const state = useSelector<AppState, AppState['assetBackedStaking']>((_state) => _state.assetBackedStaking)
    // const { data } = state.staking[chainId]?.userData    const { sReqBalance, gReqBalance, warmupInfo } = data
    return { userData: state.staking[chainId]?.userData, userDataLoaded: state.staking[chainId].userDataLoaded }
}



export function useAssetBackedStakingInfo(
    chainId: number,
    account: string
    // this is input from the balances state
): {
    epoch: Epoch
    generalDataLoaded: boolean
    stakeData: StakeData
    userData: UserData
    stakedRequiem: StakedRequiem
    stakedRequiemLoaded: boolean
    userDataLoaded: boolean
} {
    const { dataLoaded } = useAssetBackedStakingState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh } = useRefresh()

    useEffect(() => {
        if (!dataLoaded) {
            dispatch(fetchStakingData({ chainId }))
        }

    }, [chainId, dataLoaded, slowRefresh, dispatch])

    const { epoch, stakeData, userDataLoaded: udl } = useAssetBackedStakingState(chainId)

    useEffect(() => {
        if (dataLoaded && account && !udl) {
            dispatch(fetchStakingUserData({ chainId, account }))
        }

    }, [chainId, dataLoaded, slowRefresh, dispatch, account, udl])


    const { userData, userDataLoaded } = useAssetBackedStakingStateUser(chainId);


    const { stakedRequiemLoaded: sReqloaded } = useStakedRequiem(chainId)

    useEffect(() => {
        if (!sReqloaded) {
            dispatch(fetchTokenData({ chainId }))
        }

    }, [chainId, slowRefresh, dispatch, sReqloaded])


    const { stakedRequiem, stakedRequiemLoaded } = useStakedRequiem(chainId)

    return {
        epoch,
        stakeData,
        generalDataLoaded: dataLoaded,
        userData,
        userDataLoaded,
        stakedRequiem,
        stakedRequiemLoaded
    }
}