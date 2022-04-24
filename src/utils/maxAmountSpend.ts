import { CurrencyAmount, NETWORK_CCY, ZERO } from '@requiemswap/sdk'
import { MIN_BNB } from '../config/constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(chainId: number, currencyAmount?: CurrencyAmount): CurrencyAmount | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency === NETWORK_CCY[chainId]) {
    if (currencyAmount.raw.gt(MIN_BNB)) {
      return CurrencyAmount.networkCCYAmount(chainId, currencyAmount.raw.sub(MIN_BNB))
    }
    return CurrencyAmount.networkCCYAmount(chainId, ZERO)
  }
  return currencyAmount
}

export default maxAmountSpend
