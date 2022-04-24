import { createAction } from '@reduxjs/toolkit'


export const changeChainIdWeighted = createAction<{ newChainId: number }>('weightedPools/changeChainIdWeighted')

