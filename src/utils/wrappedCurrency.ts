import { Currency, CurrencyAmount,  Token, TokenAmount, WRAPPED_NETWORK_TOKENS, NETWORK_CCY } from '@requiemswap/sdk'
import { ChainId } from '../config/index'

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  return chainId && currency === NETWORK_CCY[chainId] ? WRAPPED_NETWORK_TOKENS[chainId] : currency instanceof Token ? currency : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: ChainId | undefined,
): TokenAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token): Currency {
  if (token.equals(WRAPPED_NETWORK_TOKENS[token.chainId])) return NETWORK_CCY[token.chainId]
  return token
}
