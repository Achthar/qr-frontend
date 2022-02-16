import { createAction } from '@reduxjs/toolkit'


export const changeChainId = createAction<{ newChainId: number }>('stablePools/changeChainId')

