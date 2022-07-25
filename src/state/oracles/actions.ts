import { createAction } from '@reduxjs/toolkit'

export const setChainIdOracles = createAction<{ newChainId: number }>('oracles/setChainIdOracles')