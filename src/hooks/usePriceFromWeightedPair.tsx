
import { TokenAmount, Price, JSBI, Token, WeightedPair } from "@requiemswap/sdk"
import { REQT, DAI } from "config/constants/tokens"
import { useMemo } from "react"
import { usePairContract } from "./useContract"
import { useWeightedPair, WeightedPairState } from "./useWeightedPairs"


export const usePriceFromWeightedPair = (token: Token, quoteToken: Token, weight: Number, fee: number): string => {
    // const chainId = token.chainId
    // // const pairContract = usePairContract(WeightedPair.getAddress(token, quoteToken, JSBI.BigInt(weight), JSBI.BigInt(fee)))
    // // const [reserve0]
    // const [pairState, pair] = useWeightedPair(chainId, REQT[chainId], DAI[chainId], 80, 25)

    // const price = useMemo(
    //     () =>
    //         pairState === WeightedPairState.EXISTS ?
    //             pair.priceOf(REQT[chainId]).toSignificant(4)
    //             : '0',
    //     [chainId, pair, pairState])
    // const reqtPriceUsdAsString = useMemo(

    //     () => {
    //         const inAmount = new TokenAmount(REQT[chainId], '1000000000000000000')
    //         const [outAmount,] = pairState === WeightedPairState.EXISTS ? pair.clone().getOutputAmount(inAmount) : [
    //             new TokenAmount(DAI[chainId], '0'),]

    //         return pairState === WeightedPairState.EXISTS
    //             ? (new Price(REQT[chainId], DAI[chainId], inAmount.raw, outAmount.raw)).toSignificant(4)
    //             : '-' // reqtnetworkCCYBond.token.busdPrice
    //     },
    //     [chainId, pair, pairState]
    // )

    // return reqtPriceUsdAsString

    return 'price'
}