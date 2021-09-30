import { ChainId, Currency, currencyEquals, JSBI, Price, NETWORK_CCY } from '@pancakeswap/sdk'
import { useMemo } from 'react'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { BUSD, CAKE } from '../config/constants/tokens'
import { PairState, usePairs } from './usePairs'
import { wrappedCurrency } from '../utils/wrappedCurrency'
// import { ChainId } from '../config/index'

const BUSD_MAINNET = BUSD[ChainId.BSC_MAINNET]

/**
 * Returns the price in BUSD of the input currency
 * @param currency currency to compute the BUSD price of
 */
export default function useBUSDPrice(currency?: Currency): Price {
  const { chainId } = useActiveWeb3React()
  const wrapped = wrappedCurrency(currency, chainId)
  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [
        chainId && wrapped && currencyEquals(NETWORK_CCY[chainId], wrapped) ? undefined : currency,
        chainId ? NETWORK_CCY[chainId] : undefined,
      ],
      [wrapped?.equals(BUSD_MAINNET) ? undefined : wrapped, chainId === ChainId.BSC_MAINNET ? BUSD_MAINNET : undefined],
      [chainId ? NETWORK_CCY[chainId] : undefined, chainId === ChainId.BSC_MAINNET ? BUSD_MAINNET : undefined],
    ],
    [chainId, currency, wrapped],
  )
  const [[ethPairState, ethPair], [busdPairState, busdPair], [busdEthPairState, busdEthPair]] = usePairs(
    tokenPairs,
  )

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // handle NETWORK_CCY/eth
    if (wrapped.equals(NETWORK_CCY[chainId])) {
      if (busdPair) {
        const price = busdPair.priceOf(NETWORK_CCY[chainId])
        return new Price(currency, BUSD_MAINNET, price.denominator, price.numerator)
      }
      return undefined
    }
    // handle busd
    if (wrapped.equals(BUSD_MAINNET)) {
      return new Price(BUSD_MAINNET, BUSD_MAINNET, '1', '1')
    }

    const ethPairETHAmount = ethPair?.reserveOf(NETWORK_CCY[chainId])
    const ethPairETHBUSDValue: JSBI =
      ethPairETHAmount && busdEthPair ? busdEthPair.priceOf(NETWORK_CCY[chainId]).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the busd pair
    if (
      busdPairState === PairState.EXISTS &&
      busdPair &&
      busdPair.reserveOf(BUSD_MAINNET).greaterThan(ethPairETHBUSDValue)
    ) {
      const price = busdPair.priceOf(wrapped)
      return new Price(currency, BUSD_MAINNET, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && busdEthPairState === PairState.EXISTS && busdEthPair) {
      if (busdEthPair.reserveOf(BUSD_MAINNET).greaterThan('0') && ethPair.reserveOf(NETWORK_CCY[chainId]).greaterThan('0')) {
        const ethBusdPrice = busdEthPair.priceOf(BUSD_MAINNET)
        const currencyEthPrice = ethPair.priceOf(NETWORK_CCY[chainId])
        const busdPrice = ethBusdPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, BUSD_MAINNET, busdPrice.denominator, busdPrice.numerator)
      }
    }
    return undefined
  }, [chainId, currency, ethPair, ethPairState, busdEthPair, busdEthPairState, busdPair, busdPairState, wrapped])
}

export const useCakeBusdPrice = (): Price => {
  const { chainId } = useActiveWeb3React()
  const currentChaindId = chainId || ChainId.BSC_MAINNET
  const cakeBusdPrice = useBUSDPrice(CAKE[currentChaindId])
  return cakeBusdPrice
}

// functions that directly call prsices as numbers
export const useCakeBusdPriceNumber = (digits?: number): number => {
  const price = useCakeBusdPrice()
  return price === undefined ? NaN : Number(price.toSignificant(digits ?? 10))
}


export const useBUSDPriceNumber = (currency?: Currency, digits?: number): number => {
  const price = useBUSDPrice(currency)
  return (price === undefined) ? NaN : Number(price.toSignificant(digits ?? 10))
}