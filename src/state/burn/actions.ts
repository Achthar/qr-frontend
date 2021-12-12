import { createAction } from '@reduxjs/toolkit'

export enum Field {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
  WEIGHT_A = 'WEIGHT_A',
  FEE = 'FEE'
}

export const typeInput = createAction<{ field: Field; typedValue: string }>('burn/typeInputBurn')
export const setWeight = createAction<{ typedWeight: string }>('burn/setWeightBurn')
export const setFee = createAction<{  typedFee: string }>('burn/setFeeBurn')
