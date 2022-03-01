import { TokenAmount, WeightedPair, Token, JSBI } from '@requiemswap/sdk'
import { STABLES } from 'config/constants/tokens'
import { useMemo } from 'react'
import { useGetWeightedPairsPricerState } from './useGetWeightedPairsState'


const tokenInList = (token: Token, tokenList: Token[]): boolean => {
    for (let i = 0; i < tokenList.length; i++) {
        if (token.equals(tokenList[i]))
            return true
    }
    return false
}

// provides value of total lqiuidity in refToken
const priceReserserve = (pair: WeightedPair, refTokenIs0: boolean) => {
    const [refReserve, reserveOther, refWeight, weightOther, refToken] = refTokenIs0 ? [pair.reserve0, pair.reserve1, pair.weight0, pair.weight1, pair.token0] :
        [pair.reserve1, pair.reserve0, pair.weight1, pair.weight0, pair.token1]

    return new TokenAmount(refToken, JSBI.add(JSBI.divide(JSBI.multiply(reserveOther.raw, refWeight), weightOther), refReserve.raw))
}

// calculates Value of LP if LP is made of exotic tokens
export function useGetValueCryptoUSD(tokenIn: TokenAmount, refreshGeneral: number): string {
    const chainId = tokenIn.token.chainId

    const { pairs, metaDataLoaded, reservesAndWeightsLoaded } = useGetWeightedPairsPricerState(chainId, refreshGeneral)
    const stablePairs = useMemo(() => {
        const stableBases = STABLES[chainId]
        return pairs.map(pair => { return { pair, isToken0: tokenInList(pair.token0, stableBases), isToken1: tokenInList(pair.token1, stableBases) } })
            .filter(data => data.isToken0 || data.isToken1)
    }, [chainId])

    const referencePairs = useMemo(() => {
        const token = tokenIn.token
        return pairs.map(pair => { return { pair, isToken0: pair.token0.equals(token), isToken1: pair.token1.equals(token) } })
            .filter(data => data.isToken0 || data.isToken1)
    }, [chainId])

    if (!metaDataLoaded && !reservesAndWeightsLoaded)
        return '0'

    let price = '0'
    for (let j = 0; j < referencePairs.length; j++) {
        const refPair = referencePairs[j].pair
        const refToken = referencePairs[j].isToken0 ? refPair.token0 : refPair.token1
        for (let k = 0; k < stablePairs.length; k++) {
            const [refToken2, stable] = stablePairs[k].isToken0 ? [refPair.token0, refPair.token1] : [refPair.token1, refPair.token0]
            if (refToken.equals(refToken2)) {
                const reservePrice = priceReserserve(refPair, referencePairs[j].isToken0).raw
                const val = stablePairs[k].isToken0 ? JSBI.divide(
                    JSBI.multiply(
                        stablePairs[k].pair.token0Price.numerator, reservePrice),
                    stablePairs[k].pair.token0Price.denominator) : JSBI.divide(
                        JSBI.multiply(
                            stablePairs[k].pair.token1Price.numerator, reservePrice),
                        stablePairs[k].pair.token1Price.denominator)


                price = new TokenAmount(stable, val.toString()).toSignificant(18)
            }
        }
    }
    return price
}


// export const usePricePairs = ()