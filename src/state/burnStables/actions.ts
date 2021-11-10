import { createAction } from '@reduxjs/toolkit'

export enum StablesField {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  CURRENCY_1 = 'CURRENCY_1',
  CURRENCY_2 = 'CURRENCY_2',
  CURRENCY_3 = 'CURRENCY_3',
  CURRENCY_4 = 'CURRENCY_4',
  SELECTED_SINGLE = 'SELECTED_SINGLE',
  CURRENCY_SINGLE = 'CURRENCY_SINGLE',
  LIQUIDITY_DEPENDENT = 'LIQUIDITY_DEPENDENT',
  LIQUIDITY_SINGLE = 'LIQUIDITY_SINGLE',
  CALCULATED_SINGLE_VALUES = 'CALCULATED_SINGLE_VALUES', // that field is for the calculated values from LP input
  CURRENCY_SINGLE_FEE = 'CURRENCY_SINGLE_FEE'
}

// case withdrawl by LP
export const typeInputLp = createAction<{ stablesField: StablesField; typedValueLp: string }>('burnStables/typeInputStablesBurnLp')

// withdrawl by token amounts
export const typeInput1 = createAction<{ stablesField: StablesField; typedValue1: string }>('burnStables/typeInput1StablesBurn')
export const typeInput2 = createAction<{ stablesField: StablesField; typedValue2: string }>('burnStables/typeInput2StablesBurn')
export const typeInput3 = createAction<{ stablesField: StablesField; typedValue3: string }>('burnStables/typeInput3StablesBurn')
export const typeInput4 = createAction<{ stablesField: StablesField; typedValue4: string }>('burnStables/typeInput4StablesBurn')

export const typeInput1Calculated = createAction<{ stablesField: StablesField; typedValue1: string; calculatedValues: string[] }>('burnStables/typeInput1CalculatedStablesBurn')
export const typeInput2Calculated = createAction<{ stablesField: StablesField; typedValue2: string; calculatedValues: string[] }>('burnStables/typeInput2CalculatedStablesBurn')
export const typeInput3Calculated = createAction<{ stablesField: StablesField; typedValue3: string; calculatedValues: string[] }>('burnStables/typeInput3CalculatedStablesBurn')
export const typeInput4Calculated = createAction<{ stablesField: StablesField; typedValue4: string; calculatedValues: string[] }>('burnStables/typeInput4CalculatedStablesBurn')


export const typeInput = createAction<{ stablesField: StablesField; typedValue: string }>('burnStables/typeInputStablesBurn')

// withdrawls by single Token amount
export const typeInputSingle = createAction<{ stablesField: StablesField; typedValueSingle: string }>('burnStables/typeInputSingleStablesBurn')

export const selectStableSingle = createAction<{selectedStableSingle: number }>('burnStables/selectInputSingleStablesBurn')

export const setTypeSingleInputs = createAction<{ calculatedSingleValues: string[] }>('burnStables/typeInputsFromLpCalc')