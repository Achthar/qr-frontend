import { createReducer } from '@reduxjs/toolkit'
import { StablesField, resetMintState, typeInput, typeInput1, typeInput2, typeInput3, typeInput4 } from './actions'

export interface MintStablesState {
  readonly typedValue1: string
  readonly typedValue2: string
  readonly typedValue3: string
  readonly typedValue4: string
  // values for typed balances
  readonly values: string[]
  // current typed value
  readonly typedValue: string
  // current selected index
  readonly selectedIndex: number
}

const initialState: MintStablesState = {
  typedValue1: '',
  typedValue2: '',
  typedValue3: '',
  typedValue4: '',
  values: ['0', '0', '0', '0', '0', '0'],
  typedValue: '',
  selectedIndex: 0
}

export default createReducer<MintStablesState>(initialState, (builder) =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(typeInput1, (state, { payload: { typedValue1 } }) => {
      return {
        ...state,
        typedValue1,
      }
    }).addCase(typeInput2, (state, { payload: { typedValue2 } }) => {
      return {
        ...state,
        typedValue2,
      }
    }).addCase(typeInput3, (state, { payload: { typedValue3 } }) => {
      return {
        ...state,
        typedValue3,
      }
    }).addCase(typeInput4, (state, { payload: { typedValue4 } }) => {
      return {
        ...state,
        typedValue4,
      }
    }).addCase(typeInput, (state, { payload: { typedValue, fieldIndex } }) => {
      state.selectedIndex = fieldIndex
      state.values[fieldIndex] = typedValue
    }),
)
