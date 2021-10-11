import { createAction } from '@reduxjs/toolkit'

export enum StablesField {
  CURRENCY_1 = 'CURRENCY_1',
  CURRENCY_2 = 'CURRENCY_2',
  CURRENCY_3 = 'CURRENCY_3',
  CURRENCY_4 = 'CURRENCY_4',
}

export const typeInputs = createAction<{  typedValues: string[] }>('mint/typeInputStablesMint')
export const typeInput = createAction<{  typedValue: string }>('mint/typeInputStablesMint')
export const typeInput1 = createAction<{  typedValue1: string }>('mint/typeInput1StablesMint')
export const typeInput2 = createAction<{  typedValue2: string }>('mint/typeInput2StablesMint')

export const typeInput3 = createAction<{  typedValue3: string }>('mint/typeInput3StablesMint')

export const typeInput4 = createAction<{  typedValue4: string }>('mint/typeInput4StablesMint')
export const resetMintState = createAction<void>('mint/resetMintState')
