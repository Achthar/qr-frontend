import { createAction } from '@reduxjs/toolkit'
import { Token, CurrencyAmount, TokenAmount } from '@requiemswap/sdk'

export enum BalanceField {
  STABLES = 'STABLES',
  MAIN = 'MAIN',
  WEIGHTED_PAIRS = 'WEIGHTED_PAIRS',
  STABLE_LP = 'STABLE_LP',
  CUSTOM_TOKENS = 'CUSTOM_TOKENS',
  CUSTOM_LP = 'CUSTOM_LP'
}


export const addToken = createAction<{ token: Token; slot: BalanceField }>('userBalances/addToken')
export const refreshBalances = createAction<{ newBalances:{[address:string]:string} }>('userBalances/refreshBalances')
export const refreshNetworkCcyBalance = createAction<{ newBalance:string }>('userBalances/refreshNetworkCcyBalance')
export const setBalanceLoadingState = createAction<{ newIsLoading:boolean }>('userBalances/setBalanceLoadingState')
// export const refreshBalances = createAction<{ chainId: number, account: string, slot: BalanceField }>('userBalances/refreshBalances')
export const reset = createAction<void>('userBalances/reset')
