import { createReducer } from '@reduxjs/toolkit'
import {
  StablesField,
  typeInput1,
  typeInput2,
  typeInput3,
  typeInput4,
  typeInputLp,
  typeInputSingle,
  selectStableSingle
} from './actions'

export interface BurnStablesState {
  readonly independentStablesField: StablesField
  readonly typedValueLiquidity: string
  readonly typedValue1: string
  readonly typedValue2: string
  readonly typedValue3: string
  readonly typedValue4: string
  readonly selectedStableSingle: number
  readonly typedValueSingle: string

}

const initialState: BurnStablesState = {
  independentStablesField: StablesField.LIQUIDITY_PERCENT,
  typedValueLiquidity: '0',
  typedValue1: '0',
  typedValue2: '0',
  typedValue3: '0',
  typedValue4: '0',
  selectedStableSingle: 0,
  typedValueSingle: '0',
}

export default createReducer<BurnStablesState>(initialState, (builder) =>
  builder.addCase(typeInputLp, (state, { payload: { stablesField, typedValueLp } }) => {
    return {
      ...state,
      independentStablesField: stablesField,
      typedValueLp,
    }
  }).addCase(typeInput1, (state, { payload: { stablesField, typedValue1 } }) => {
    return {
      ...state,
      independentStablesField: stablesField,
      typedValue1,
    }
  }).addCase(typeInput2, (state, { payload: { stablesField, typedValue2 } }) => {
    return {
      ...state,
      independentStablesField: stablesField,
      typedValue2,
    }
  }).addCase(typeInput3, (state, { payload: { stablesField, typedValue3 } }) => {
    return {
      ...state,
      independentStablesField: stablesField,
      typedValue3,
    }
  }).addCase(typeInput4, (state, { payload: { stablesField, typedValue4 } }) => {
    return {
      ...state,
      independentStablesField: stablesField,
      typedValue4,
    }
  }).addCase(typeInputSingle, (state, { payload: { stablesField, typedValueSingle } }) => {
    return {
      ...state,
      independentStablesField: stablesField,
      typedValueSingle,
    }
  }),
)
