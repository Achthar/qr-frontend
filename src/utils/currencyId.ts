import { Currency, ETHER, Token } from '@pancakeswap/sdk'

export function currencyId(chainId: number, currency: Currency): string {
  if (currency === ETHER) {
    if (chainId === 56 || chainId === 97) { return 'BNB' }
    if (chainId === 137 || chainId === 80001) { return 'MATIC' }
  }

  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}

export default currencyId
