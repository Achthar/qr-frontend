import { CurrencyAmount, ETHER, JSBI, NETWORK_CCY } from '@requiemswap/sdk'
import { MIN_BNB } from '../config/constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(chainId:number, currencyAmount?: CurrencyAmount): CurrencyAmount | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency === NETWORK_CCY[chainId]) {
    if (JSBI.greaterThan(currencyAmount.raw, MIN_BNB)) {
      return CurrencyAmount.networkCCYAmount(chainId, JSBI.subtract(currencyAmount.raw, MIN_BNB))
    }
    return CurrencyAmount.networkCCYAmount(chainId, JSBI.BigInt(0))
  }
  return currencyAmount
}

export default maxAmountSpend
