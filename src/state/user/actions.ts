import { createAction } from '@reduxjs/toolkit'
import { SerializedToken } from 'config/constants/types'
import { SerializedWeightedPair, WeightedPairMetaData } from 'state/types'
import { FarmStakedOnly, SerializedPair } from './types'





export const updateMatchesDarkMode = createAction<{ matchesDarkMode: boolean }>('user/updateMatchesDarkMode')
export const updateUserDarkMode = createAction<{ userDarkMode: boolean }>('user/updateUserDarkMode')
export const updateUserExpertMode = createAction<{ userExpertMode: boolean }>('user/updateUserExpertMode')
export const updateUserSingleHopOnly = createAction<{ userSingleHopOnly: boolean }>('user/updateUserSingleHopOnly')
export const updateUserSlippageTolerance = createAction<{ userSlippageTolerance: number }>(
  'user/updateUserSlippageTolerance',
)
export const updateUserDeadline = createAction<{ userDeadline: number }>('user/updateUserDeadline')
export const addSerializedToken = createAction<{ serializedToken: SerializedToken }>('user/addSerializedToken')
export const removeSerializedToken = createAction<{ chainId: number; address: string }>('user/removeSerializedToken')
export const addSerializedPair = createAction<{ serializedPair: SerializedPair }>('user/addSerializedPair')
export const addSerializedWeightedPair = createAction<{ serializedWeightedPair: WeightedPairMetaData }>('user/addSerializedWeightedPair')
export const removeSerializedPair =
  createAction<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>('user/removeSerializedPair')

export const muteAudio = createAction<void>('user/muteAudio')
export const unmuteAudio = createAction<void>('user/unmuteAudio')
export const toggleTheme = createAction<void>('user/toggleTheme')
export const updateUserFarmStakedOnly = createAction<{ userFarmStakedOnly: FarmStakedOnly }>(
  'user/updateUserFarmStakedOnly',
)
export const updateGasPrice = createAction<{ gasPrice: string }>('user/updateGasPrice')
export const toggleURLWarning = createAction<void>('app/toggleURLWarning')

export const refreshBalances = createAction<{ chainId: number, newBalances: { [address: string]: string } }>('user/refreshBalances')
export const refreshNetworkCcyBalance = createAction<{ newBalance: string }>('user/refreshNetworkCcyBalance')
export const setBalanceLoadingState = createAction<{ newIsLoading: boolean }>('user/setBalanceLoadingState')
// export const refreshBalances = createAction<{ chainId: number, account: string, slot: BalanceField }>('user/refreshBalances')
export const reset = createAction<void>('user/reset')

export const changeChainId = createAction<{ newChainId: number}>('user/changeChainId')