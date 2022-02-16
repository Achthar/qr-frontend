import { Currency, Token, NETWORK_CCY } from '@requiemswap/sdk'

export function currencyId(chainId: number, currency: Currency): string {
  if (currency === NETWORK_CCY[chainId]) {
    if (chainId === 56 || chainId === 97) { return 'BNB' }
    if (chainId === 137 || chainId === 80001) { return 'MATIC' }
    if (chainId === 43113 || chainId === 43114) { return 'AVAX' }
    if (chainId === 42261 || chainId === 42261) { return 'ROSE' }
    if (chainId === 110001) { return 'QKC' }
  }

  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}

export default currencyId
