import { createAction } from '@reduxjs/toolkit'
import { BondType } from 'config/constants/types'


export const setLpPrice = createAction<{ price: string, bondId: number, bondType: BondType }>('bonds/setLpPrice')
export const setLpLink = createAction<{ link: string, bondId: number, bondType: BondType }>('bonds/setLpLink')