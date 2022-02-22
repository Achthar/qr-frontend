import { createAction } from '@reduxjs/toolkit'


export const changeChainIdStables = createAction<{ newChainId: number }>('stablePools/changeChainIdStables')

