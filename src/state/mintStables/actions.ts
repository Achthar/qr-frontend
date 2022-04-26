import { createAction } from '@reduxjs/toolkit'

export enum StablesField {
  CURRENCY_1 = 'CURRENCY_1',
  CURRENCY_2 = 'CURRENCY_2',
  CURRENCY_3 = 'CURRENCY_3',
  CURRENCY_4 = 'CURRENCY_4',
}

export const typeInputs = createAction<{ typedValues: string[] }>('mintStables/typeInputStablesMint')
export const typeInput = createAction<{ typedValue: string, fieldIndex: number }>('mintStables/typeInputStablesMint')
export const typeInput1 = createAction<{ typedValue1: string }>('mintStables/typeInput1StablesMint')
export const typeInput2 = createAction<{ typedValue2: string }>('mintStables/typeInput2StablesMint')

export const typeInput3 = createAction<{ typedValue3: string }>('mintStables/typeInput3StablesMint')

export const typeInput4 = createAction<{ typedValue4: string }>('mintStables/typeInput4StablesMint')
export const resetMintState = createAction<void>('mintStables/resetMintState')
