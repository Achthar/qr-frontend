import { createAction } from '@reduxjs/toolkit'


export const setLpPrice = createAction<{ price: string, bondId: number }>('bonds/setLpPrice')
