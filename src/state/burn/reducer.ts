import { createReducer } from '@reduxjs/toolkit'
import { Field, typeInput, setWeight, setFee } from './actions'

export interface BurnState {
  readonly independentField: Field
  readonly typedValue: string
  readonly weightFieldA: string
  readonly fee: string
}

const initialState: BurnState = {
  independentField: Field.LIQUIDITY_PERCENT,
  typedValue: '0',
  weightFieldA: '50',
  fee: '10'
}

export default createReducer<BurnState>(initialState, (builder) =>
  builder.addCase(typeInput, (state, { payload: { field, typedValue } }) => {
    return {
      ...state,
      independentField: field,
      typedValue,
    }
  }).addCase(setWeight, (state, { payload: { typedWeight } }) => {
    return {
      ...state,
      weightFiedA: typedWeight,
    }
  }).addCase(setFee, (state, { payload: { typedFee } }) => {
    return {
      ...state,
      fee: typedFee,
    }
  }),
)
