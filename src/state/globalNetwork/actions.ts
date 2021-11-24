import { createAction } from '@reduxjs/toolkit'

export const setChainId = createAction<{ chainId:number }>('globalNetwork/setChainId')

export const setAccount = createAction<{ account:string }>('globalNetwork/setAccount')
