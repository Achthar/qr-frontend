import { createReducer } from '@reduxjs/toolkit'
import { WeightedField, resetMintState, typeInput, typeInputWeight, typeInputFee, typeInputAmp } from './actions'

export interface MintWeightedPairState {
  readonly independentField: WeightedField
  readonly typedValue: string
  readonly otherTypedValue: string // for the case when there's no liquidity
  readonly independentWeightField: WeightedField
  readonly typedWeight: string
  readonly typedFee: string
  readonly typedAmp: string
}

const initialState: MintWeightedPairState = {
  independentField: WeightedField.CURRENCY_A,
  typedValue: '',
  otherTypedValue: '',
  independentWeightField: WeightedField.WEIGHT_A,
  typedWeight: '',
  typedFee: '',
  typedAmp: ''
}

export default createReducer<MintWeightedPairState>(initialState, (builder) =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity } }) => {
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        if (field === state.independentField) {
          return {
            ...state,
            independentField: field,
            typedValue,
          }
        }
        // they're typing into a new field, store the other value

        return {
          ...state,
          independentField: field,
          typedValue,
          otherTypedValue: state.typedValue,
        }
      }
      return {
        ...state,
        independentField: field,
        typedValue,
        otherTypedValue: '',
      }
    }).addCase(typeInputWeight, (state, { payload: { field, typedValue, noLiquidity } }) => {
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        if (field === state.independentWeightField) {
          return {
            ...state,
            independentWeightField: field,
            typedWeight: typedValue,
          }
        }
        // they're typing into a new field, store the other value

        return {
          ...state,
          independentWeightField: field,
          typedWeight: typedValue,
          otherTypedValue: state.typedValue,
        }
      }
      return {
        ...state,
        independentWeightField: field,
        typedWeight: typedValue,
        otherTypedValue: '',
      }
    }).addCase(typeInputFee, (state, { payload: { typedValue } }) => {
      // just the Fee input
      return {
        ...state,
        typedFee: typedValue,
      }
    }).addCase(typeInputAmp, (state, { payload: { typedValue } }) => {
      // just the Amp input
      return {
        ...state,
        typedAmp: typedValue,
      }
    }),
)
