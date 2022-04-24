// import { ChainId, Currency, currencyEquals, ZERO, Price, NETWORK_CCY, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
// import { BigNumber } from 'ethers'
// import { useMemo } from 'react'
import { useNetworkState } from 'state/globalNetwork/hooks'
// import { BUSD, CAKE } from '../config/constants/tokens'
// import { PairState, usePairs } from './usePairs'
// import { wrappedCurrency } from '../utils/wrappedCurrency'

// const BUSD_MAINNET = BUSD[ChainId.BSC_MAINNET]

// /**
//  * Returns the price in BUSD of the input currency
//  * @param currency currency to compute the BUSD price of
//  */
// export default function useUSDPrice(currency?: Currency): Price {
//   const { chainId } = useNetworkState()
//   const wrapped = wrappedCurrency(currency, chainId)
//   const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
//     () => [
//       [
//         chainId && wrapped && currencyEquals(NETWORK_CCY[chainId], wrapped) ? undefined : currency,
//         chainId ? NETWORK_CCY[chainId] : undefined,
//       ],
//       [wrapped?.equals(BUSD_MAINNET) ? undefined : wrapped, chainId === ChainId.BSC_MAINNET ? BUSD_MAINNET : undefined],
//       [chainId ? NETWORK_CCY[chainId] : undefined, chainId === ChainId.BSC_MAINNET ? BUSD_MAINNET : undefined],
//     ],
//     [chainId, currency, wrapped],
//   )
//   const [[ethPairState, ethPair], [busdPairState, busdPair], [busdEthPairState, busdEthPair]] = usePairs(
//     chainId,
//     tokenPairs,
//   )

//   return useMemo(() => {
//     if (!currency || !wrapped || !chainId) {
//       return undefined
//     }
//     // handle NETWORK_CCY/eth
//     if (wrapped.equals(WRAPPED_NETWORK_TOKENS[chainId])) {
//       if (busdPair) {
//         const price = busdPair.priceOf(WRAPPED_NETWORK_TOKENS[chainId])
//         return new Price(currency, BUSD_MAINNET, price.denominator, price.numerator)
//       }
//       return undefined
//     }
//     // handle busd
//     if (wrapped.equals(BUSD_MAINNET)) {
//       return new Price(BUSD_MAINNET, BUSD_MAINNET, '1', '1')
//     }

//     const ethPairETHAmount = ethPair?.reserveOf(WRAPPED_NETWORK_TOKENS[chainId])
//     const ethPairETHBUSDValue: BigNumber =
//       ethPairETHAmount && busdEthPair ? busdEthPair.priceOf(WRAPPED_NETWORK_TOKENS[chainId]).quote(ethPairETHAmount).raw : ZERO

//     // all other tokens
//     // first try the busd pair
//     if (
//       busdPairState === PairState.EXISTS &&
//       busdPair &&
//       busdPair.reserveOf(BUSD_MAINNET).greaterThan(ethPairETHBUSDValue)
//     ) {
//       const price = busdPair.priceOf(wrapped)
//       return new Price(currency, BUSD_MAINNET, price.denominator, price.numerator)
//     }
//     if (ethPairState === PairState.EXISTS && ethPair && busdEthPairState === PairState.EXISTS && busdEthPair) {
//       if (busdEthPair.reserveOf(BUSD_MAINNET).greaterThan('0') && ethPair.reserveOf(WRAPPED_NETWORK_TOKENS[chainId]).greaterThan('0')) {
//         const ethBusdPrice = busdEthPair.priceOf(BUSD_MAINNET)
//         const currencyEthPrice = ethPair.priceOf(WRAPPED_NETWORK_TOKENS[chainId])
//         const busdPrice = ethBusdPrice.multiply(currencyEthPrice).invert()
//         return new Price(currency, BUSD_MAINNET, busdPrice.denominator, busdPrice.numerator)
//       }
//     }
//     return undefined
//   }, [chainId, currency, ethPair, ethPairState, busdEthPair, busdEthPairState, busdPair, busdPairState, wrapped])
// }

// export const useCakeBusdPrice = (): Price => {
//   const { chainId } = useNetworkState()
//   const currentChaindId = chainId || ChainId.BSC_MAINNET
//   const cakeBusdPrice = useUSDPrice(CAKE[currentChaindId])
//   return cakeBusdPrice
// }

// // functions that directly call prsices as numbers
// export const useCakeBusdPriceNumber = (digits?: number): number => {
//   const price = useCakeBusdPrice()
//   return price === undefined ? NaN : Number(price.toSignificant(digits ?? 10))
// }


// export const useUSDPriceNumber = (currency?: Currency, digits?: number): number => {
//   const price = useUSDPrice(currency)
//   return (price === undefined) ? NaN : Number(price.toSignificant(digits ?? 10))
// }