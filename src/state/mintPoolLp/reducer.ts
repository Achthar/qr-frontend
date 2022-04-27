import { createReducer } from '@reduxjs/toolkit'
import { resetMintState, typeInput, } from './actions'

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
    .addCase(typeInput, (state, { payload: { typedValue, fieldIndex } }) => {
      state.selectedIndex = fieldIndex
      state.values[fieldIndex] = typedValue
    }),
)
