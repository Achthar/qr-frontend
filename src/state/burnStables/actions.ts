import { createAction } from '@reduxjs/toolkit'

export enum StablesField {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  CURRENCY_1 = 'CURRENCY_1',
  CURRENCY_2 = 'CURRENCY_2',
  CURRENCY_3 = 'CURRENCY_3',
  CURRENCY_4 = 'CURRENCY_4',
  SELECTED_SINGLE = 'SELECTED_SINGLE',
  CURRENCY_SINGLE = 'CURRENCY_SINGLE'
}

// case withdrawl by LP
export const typeInputLp = createAction<{ stablesField: StablesField; typedValueLp: string }>('burn/typeInputStablesBurnLp')

// withdrawl by token amounts
export const typeInput1 = createAction<{ stablesField: StablesField; typedValue1: string }>('burn/typeInput1StablesBurn')
export const typeInput2 = createAction<{ stablesField: StablesField; typedValue2: string }>('burn/typeInput2StablesBurn')
export const typeInput3 = createAction<{ stablesField: StablesField; typedValue3: string }>('burn/typeInput3StablesBurn')
export const typeInput4 = createAction<{ stablesField: StablesField; typedValue4: string }>('burn/typeInput4StablesBurn')

// withdrawls by single Token amount
export const typeInputSingle = createAction<{ stablesField: StablesField; typedValueSingle: string }>('burn/typeInputSingleStablesBurn')

export const selectStableSingle = createAction<{ stablesField: StablesField; selectedStableSingle: number }>('burn/typeInputSingleStablesBurn')