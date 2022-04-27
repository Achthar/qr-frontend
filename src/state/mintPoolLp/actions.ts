import { createAction } from '@reduxjs/toolkit'

export const typeInputs = createAction<{ typedValues: string[] }>('mintPoolLp/typeInputPoolMint')
export const typeInput = createAction<{ typedValue: string, fieldIndex: number }>('mintPoolLp/typeInputPoolMint')
export const resetMintState = createAction<void>('mintPoolLp/resetMintState')
