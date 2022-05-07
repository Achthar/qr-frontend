import { Pool, PoolType, STABLECOINS, StablePool, TokenAmount } from '@requiemswap/sdk'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { SerializedFarm, SerializedWeightedPair } from 'state/types'
import { deserializeToken } from 'state/user/hooks/helpers'
import { FarmWithStakedValue } from 'views/Farms/components/FarmCard/CardActionsContainer'


const TENK = BigNumber.from(10000)

// export const getFarmPair = (farm: SerializedFarm, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): SerializedWeightedPair => {
//     const [key0, key1] = farm.token.address.toLowerCase() < farm.quoteToken.address.toLowerCase() ?
//         [`${getAddress(farm.token.address)}-${getAddress(farm.quoteToken.address)}`, `${farm.lpData.weight}-${farm.lpData.fee}`] :
//         [`${getAddress(farm.quoteToken.address)}-${getAddress(farm.token.address)}`, `${100 - farm.lpData.weight}-${farm.lpData.fee}`]

//     return allPairs[key0][key1]
// }

// export const getFarmPrice = (farm: SerializedFarm, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
//     const relevantPair = getFarmPair(farm, allPairs)
//     const [is0, priceable] = isPriceable(relevantPair)
//     if (priceable) {
//         return is0 ? relevantPair.value0 : relevantPair.value1
//     }

//     return 0
// }


export const pricePair = (pair: SerializedWeightedPair, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
    const keys = Object.keys(allPairs)
    return 0
}

export const isPriceable = (pair: SerializedWeightedPair): [boolean, boolean] => {
    const chainId = pair.token0.chainId
    for (let i = 0; i < STABLECOINS[chainId].length; i++) {
        const is0 = pair.token0.address === STABLECOINS[chainId][i].address
        if (is0 || pair.token1.address === STABLECOINS[chainId][i].address)
            return [is0, true]
    }
    return [false, false]
}

export const getAddressKey = (tokenA: any, tokenB: any): string => {
    return tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ?
        `${getAddress(tokenA.address)}-${getAddress(tokenB.address)}` :
        `${getAddress(tokenB.address)}-${getAddress(tokenA.address)}`
}

export const priceWeightedFarm = (farm: SerializedFarm | FarmWithStakedValue, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }) => {
    const keys = farm.lpData.pricerKey
    if (!allPairs || !allPairs[keys[0]])
        return 0
    const quote = getAddress(farm.tokens[farm.quoteTokenIndex].address)
    const quoteIs0 = quote === Object.values(allPairs[keys[0]])[0].token0.address
    const key2 = quoteIs0 ? `${100 - farm.lpData.weight}-${farm.lpData.fee}` : `${farm.lpData.weight}-${farm.lpData.fee}`
    if (!allPairs[keys[0]][key2]?.value0)
        return 0
    let valueInQuote = quoteIs0 ? allPairs[keys[0]][key2].value0 : allPairs[keys[0]][key2].value1

    if (keys.length === 1) {
        return valueInQuote
    }

    for (let i = 1; i < keys.length; i++) {
        const nextPair = Object.values(allPairs[keys[i]])[0]
        const thisQuoteIs0 = quote === nextPair.token0.address
        valueInQuote *= thisQuoteIs0 ? nextPair.price0 : nextPair.price1
    }
    return valueInQuote

}

export const priceStableFarm = (farm: SerializedFarm | FarmWithStakedValue, pool: Pool): number => {
    if (!pool)
        return 0
    const quote = deserializeToken(farm.tokens[farm.quoteTokenIndex])
    const quoteIndex = pool.indexFromToken(quote)
    let val = BigNumber.from(0)

    for (let i = 1; i < Object.values(pool.tokens).length; i++) {
        if (i !== quoteIndex) {
            const inAmount = pool.tokenBalances[i].div(TENK)
            val = val.add(pool.calculateSwapGivenIn(pool.tokenFromIndex(i), pool.tokenFromIndex(quoteIndex), inAmount))
        }
    }
    return Number(new TokenAmount(quote, val.mul(TENK).toString()).toSignificant(18))

}


export { }