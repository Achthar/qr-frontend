
import { REQT, DAI } from "config/constants/tokens"
// import { useMemo } from "react"
// import { useWeightedPair, WeightedPairState } from "./useWeightedPairs"


// export const useReqtPrice = (chainId: number): string => {

//     const [pairState, pair] = useWeightedPair(chainId, REQT[chainId], DAI[chainId], 80, 25)

//     const price = useMemo(
//         () =>
//             pairState === WeightedPairState.EXISTS ?
//                 pair.priceOf(REQT[chainId]).toSignificant(4)
//                 : '0',
//         [chainId, pair, pairState])
//     // const reqtPriceUsdAsString = useMemo(

//     //     () => {
//     //         const inAmount = new TokenAmount(REQT[chainId], '1000000000000000000')
//     //         const [outAmount,] = pairState === WeightedPairState.EXISTS ? pair.clone().getOutputAmount(inAmount) : [
//     //             new TokenAmount(DAI[chainId], '0'),]

//     //         return pairState === WeightedPairState.EXISTS
//     //             ? (new Price(REQT[chainId], DAI[chainId], inAmount.raw, outAmount.raw)).toSignificant(4)
//     //             : '-' // reqtnetworkCCYBond.token.busdPrice
//     //     },
//     //     [chainId, pair, pairState]
//     // )

//     // return reqtPriceUsdAsString

//     return price
// }