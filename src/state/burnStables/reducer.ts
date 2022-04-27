import { createReducer } from '@reduxjs/toolkit'
import {
  StablesField,
  typeInput1,
  typeInput2,
  typeInput3,
  typeInput4,
  typeInput,
  typeInputLp,
  typeInputSingle,
  selectStableSingle,
  setTypeSingleInputs,
  typeInput1Calculated,
  typeInput2Calculated,
  typeInput3Calculated,
  typeInput4Calculated,
} from './actions'

export interface BurnStablesState {
  readonly independentStablesField: StablesField
  readonly typedValueLiquidity: string
  readonly typedValue1: string
  readonly typedValue2: string
  readonly typedValue3: string
  readonly typedValue4: string
  readonly calculatedSingleValues: string[]
  readonly typedValues: string[]
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
  calculatedSingleValues: ['0', '0', '0', '0', '0'],
  typedValues: ['0', '0', '0', '0', '0'],
  selectedStableSingle: 0,
  typedValueSingle: '0',
}

export default createReducer<BurnStablesState>(initialState, (builder) =>
  builder
    .addCase(typeInputLp, (state, { payload: { stablesField, typedValueLp } }) => {
      return {
        ...state,
        independentStablesField: stablesField,
        typedValueLiquidity: typedValueLp,
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
    }).addCase(setTypeSingleInputs, (state, { payload: { calculatedSingleValues } }) => {
      return {
        ...state,
        calculatedSingleValues
      }

    }).addCase(typeInput, (state, { payload: { stablesField, typedValue } }) => {
      return {
        ...state,
        independentStablesField: stablesField,
        typedValue4: typedValue,
      }
    }).addCase(typeInput1Calculated, (state, { payload: { stablesField, typedValue1, calculatedValues } }) => {
      return {
        ...state,
        independentStablesField: stablesField,
        typedValue1,
        typedValue2: calculatedValues[1],
        typedValue3: calculatedValues[2],
        typedValue4: calculatedValues[3],
      }
    }).addCase(typeInput2Calculated, (state, { payload: { stablesField, typedValue2, calculatedValues } }) => {
      return {
        ...state,
        independentStablesField: stablesField,
        typedValue1: calculatedValues[0],
        typedValue2,
        typedValue3: calculatedValues[2],
        typedValue4: calculatedValues[3],
      }
    }).addCase(typeInput3Calculated, (state, { payload: { stablesField, typedValue3, calculatedValues } }) => {
      return {
        ...state,
        independentStablesField: stablesField,
        typedValue1: calculatedValues[0],
        typedValue2: calculatedValues[1],
        typedValue3,
        typedValue4: calculatedValues[3],
      }
    }).addCase(typeInput4Calculated, (state, { payload: { stablesField, typedValue4, calculatedValues } }) => {
      return {
        ...state,
        independentStablesField: stablesField,
        typedValue1: calculatedValues[0],
        typedValue2: calculatedValues[1],
        typedValue3: calculatedValues[2],
        typedValue4,
      }
    }).addCase(selectStableSingle, (state, { payload: { selectedStableSingle } }) => {
      return {
        ...state,
        selectedStableSingle,
      }
    }),
)
