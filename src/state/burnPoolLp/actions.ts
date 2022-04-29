import { createAction } from '@reduxjs/toolkit'

export enum PoolField {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  SELECTED_SINGLE = 'SELECTED_SINGLE',
  CURRENCY_SINGLE = 'CURRENCY_SINGLE',
  LIQUIDITY_DEPENDENT = 'LIQUIDITY_DEPENDENT',
  LIQUIDITY_SINGLE = 'LIQUIDITY_SINGLE',
  CALCULATED_SINGLE_VALUES = 'CALCULATED_SINGLE_VALUES', // that field is for the calculated values from LP input
  CURRENCY_SINGLE_FEE = 'CURRENCY_SINGLE_FEE'
}

// case withdrawl by LP
export const typeInputLp = createAction<{ poolField: PoolField; typedValueLp: string }>('burnPoolLp/typeInputStablesBurnLp')


export const typeInput = createAction<{ poolField: PoolField; typedValue: string }>('burnPoolLp/typeInputStablesBurn')

// withdrawls by single Token amount
export const typeInputSingle = createAction<{ poolField: PoolField; typedValueSingle: string }>('burnPoolLp/typeInputSingleStablesBurn')

export const selectStableSingle = createAction<{ selectedStableSingle: number }>('burnPoolLp/selectInputSingleStablesBurn')

export const setTypeSingleInputs = createAction<{ calculatedSingleValues: string[] }>('burnPoolLp/typeInputsFromLpCalc')

export const typeInputPooledToken = createAction<{ typedValue: string, index: number }>('burnPoolLp/typeInputPooledToken')