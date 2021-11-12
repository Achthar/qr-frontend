import { createAction } from '@reduxjs/toolkit'

export const setChainId = createAction<{ chainId:number }>('globalNetwork/setChainId')
