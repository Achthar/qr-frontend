import { createAction } from '@reduxjs/toolkit'


export const setLpPrice = createAction<{ price: string, bondId: number }>('bonds/setLpPrice')
export const setLpLink = createAction<{ link: string, bondId: number }>('bonds/setLpLink')