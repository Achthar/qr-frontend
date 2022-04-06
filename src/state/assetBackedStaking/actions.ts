import { createAction } from '@reduxjs/toolkit'


export const typeInput = createAction<{ typedValue: string }>('assetBackedStaking/typeInput')
export const typeInputTime = createAction<{ typedTime: string }>('assetBackedStaking/typeInputTime')
