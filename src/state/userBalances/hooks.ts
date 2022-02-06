import { Currency, CurrencyAmount, WRAPPED_NETWORK_TOKENS, JSBI, NETWORK_CCY, TokenAmount, Token, STABLECOINS } from '@requiemswap/sdk'
import { useCallback, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getAddress } from '@ethersproject/address'
import { REQT, WBTC, WETH } from 'config/constants/tokens'

import { AppDispatch, AppState } from '../index'





const ZERO = JSBI.BigInt(0)

export function useUserBalancesState(): AppState['userBalances'] {
  return useSelector<AppState, AppState['userBalances']>((state) => state.userBalances)
}

// export function useUserBalancesActionHandlers(): {
//   onAddToken: (token: Token, slot: BalanceField) => void
//   onRefreshAllBalances: (networkCcyBalance: CurrencyAmount, mainBalances: TokenAmount[], stableBalances: TokenAmount[]) => void
// } {
//   const dispatch = useDispatch<AppDispatch>()

//   const onAddToken = useCallback(
//     (token: Token, slot: BalanceField) => {
//       dispatch(addToken({ token, slot }))
//     },
//     [dispatch],
//   )
//   const onRefreshAllBalances = useCallback(
//     (networkCcyBalance: CurrencyAmount, mainBalances: TokenAmount[], stableBalances: TokenAmount[]) => {
//       dispatch(refreshAllBalances({ networkCcyBalance, mainBalances, stableBalances }))
//     },
//     [dispatch]
//   )

//   return {
//     onAddToken,
//     onRefreshAllBalances
//   }
// }

export function getMainTokens(chainId: number): Token[] {
  return [WRAPPED_NETWORK_TOKENS[chainId], REQT[chainId], WBTC[chainId], WETH[chainId]]
}

export function getStables(chainId: number): Token[] {
  return STABLECOINS[chainId]
}

export function getTokenAmounts(chainId: number, balances: { [address: string]: string }) {
  return [...[
    WRAPPED_NETWORK_TOKENS[chainId],
    REQT[chainId],
  ],
  ...[WBTC[chainId], WETH[chainId]],
  ...STABLECOINS[chainId]
  ].map(token => new TokenAmount(token, balances[getAddress(token.address)] ?? '0'))

}

export function getStableAmounts(chainId: number, balances: { [address: string]: string }) {
  return STABLECOINS[chainId].map(token => new TokenAmount(token, balances[getAddress(token.address)] ?? '0'))

}

export function getMainAmounts(chainId: number, balances: { [address: string]: string }) {
  return [
    WRAPPED_NETWORK_TOKENS[chainId],
    REQT[chainId],
    WBTC[chainId],
    WETH[chainId]
  ].map(token => new TokenAmount(token, balances[getAddress(token.address)] ?? '0'))

}

