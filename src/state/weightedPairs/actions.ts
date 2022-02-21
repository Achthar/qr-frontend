import { createAction } from '@reduxjs/toolkit'


export const changeChainIdWeighted = createAction<{ newChainId: number }>('weightedPairs/changeChainIdWeighted')

export const metaDataChange = createAction<{ chainId: number }>('weightedPairs/metaDataChange')


export const triggerRefreshUserData = createAction<{ chainId: number }>('weightedPairs/triggerRefreshUserData')
