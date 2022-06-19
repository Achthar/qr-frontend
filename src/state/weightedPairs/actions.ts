import { createAction } from '@reduxjs/toolkit'
import { TokenPair } from 'config/constants/types'


export const changeChainIdWeighted = createAction<{ newChainId: number }>('weightedPairs/changeChainIdWeighted')

export const metaDataChange = createAction<{ chainId: number }>('weightedPairs/metaDataChange')

export const triggerRefreshUserData = createAction<{ chainId: number }>('weightedPairs/triggerRefreshUserData')

export const addTokenPair = createAction<{ tokenPair:TokenPair }>('weightedPairs/addTokenPair')

export const setMetdataLoaded = createAction('weightedPairs/setMetdataLoaded')

export const pricePairs = createAction('weightedPairs/pricePairs')
