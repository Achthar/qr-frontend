import { createReducer } from '@reduxjs/toolkit'
import {
  PoolField,

  typeInput,
  typeInputLp,
  typeInputSingle,
  selectStableSingle,
  setTypeSingleInputs,
  typeInputPooledToken,
} from './actions'

export interface BurnPoolLpState {
  readonly independentPoolField: PoolField
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

const initialState: BurnPoolLpState = {
  independentPoolField: PoolField.LIQUIDITY_PERCENT,
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

export default createReducer<BurnPoolLpState>(initialState, (builder) =>
  builder
    .addCase(typeInputLp, (state, { payload: { poolField, typedValueLp } }) => {
      return {
        ...state,
        independentPoolField: poolField,
        typedValueLiquidity: typedValueLp,
      }
    }).addCase(typeInputSingle, (state, { payload: { poolField, typedValueSingle } }) => {
      return {
        ...state,
        independentPoolField: poolField,
        typedValueSingle,
      }
    }).addCase(setTypeSingleInputs, (state, { payload: { calculatedSingleValues } }) => {
      return {
        ...state,
        calculatedSingleValues
      }

    }).addCase(typeInput, (state, { payload: { poolField, typedValue } }) => {
      return {
        ...state,
        independentPoolField: poolField,
        typedValue4: typedValue,
      }
    }).addCase(selectStableSingle, (state, { payload: { selectedStableSingle } }) => {
      return {
        ...state,
        selectedStableSingle,
      }
    }).addCase(typeInputPooledToken, (state, { payload: { typedValue, index } }) => {
      state.typedValues[index] = typedValue
    }),
)
