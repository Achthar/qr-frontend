import { createAction } from '@reduxjs/toolkit'

export enum WeightedField {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
  WEIGHT_A = 'WEIGHT_A',
  WEIGHT_B = 'WEIGHT_B',
}


export const typeInput = createAction<{ field: WeightedField; typedValue: string; noLiquidity: boolean }>('mintWeightedPair/typeInputMint')
export const typeInputFee = createAction<{ typedValue: string }>('mintWeightedPair/typeInputFee')
export const typeInputWeight = createAction<{ field: WeightedField; typedValue: string; noLiquidity: boolean }>('mintWeightedPair/typeInputWeight')
export const resetMintState = createAction<void>('mintWeightedPair/resetMintState')
export const typeInputAmp = createAction<{ typedValue: string }>('mintWeightedPair/typeInputAmp')