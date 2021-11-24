import { createAction } from '@reduxjs/toolkit'

export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}


export const typeInput = createAction<{ field: Field; typedValue: string; noLiquidity: boolean }>('mintWeightedPair/typeInputMint')
export const typeInputPercentage = createAction<{ field: Field; typedValue: string; noLiquidity: boolean }>('mintWeightedPair/typeInputMint')
export const resetMintState = createAction<void>('mintWeightedPair/resetMintState')
