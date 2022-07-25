import { createAction } from '@reduxjs/toolkit'
import { BondType } from 'config/constants/types'



export const changeChainIdBonds = createAction<{ newChainId: number }>('bonds/changeChainIdBonds')
export const setLpPrice = createAction<{ price: string, bondId: number, bondType: BondType, chainId: number }>('bonds/setLpPrice')
export const setLpLink = createAction<{ link: string, bondId: number, bondType: BondType, chainId: number }>('bonds/setLpLink')