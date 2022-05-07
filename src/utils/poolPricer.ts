import { PoolType, STABLECOINS, StablePool, TokenAmount } from '@requiemswap/sdk'
import { ABREQ, DAI, REQT } from 'config/constants/tokens'
import { PoolClass } from 'config/constants/types'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { SerializedFarm, SerializedWeightedPair } from 'state/types'
import { deserializeToken } from 'state/user/hooks/helpers'
import { FarmWithStakedValue } from 'views/Farms/components/FarmCard/CardActionsContainer'


const TENK = BigNumber.from(10000)


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

export const priceStableFarm = (farm: SerializedFarm | FarmWithStakedValue, stablePool: StablePool): number => {
    if (!stablePool || farm.poolClass !== PoolClass.STABLE)
        return 0
    const quote = deserializeToken(farm.tokens[farm.quoteTokenIndex])
    const quoteIndex = stablePool.indexFromToken(quote)
    let val = BigNumber.from(0)

    for (let i = 1; i < Object.values(stablePool.tokens).length; i++) {
        if (i !== quoteIndex) {
            const inAmount = stablePool.tokenBalances[i].div(TENK)
            val = val.add(stablePool.calculateSwapGivenIn(stablePool.tokenFromIndex(i), stablePool.tokenFromIndex(quoteIndex), inAmount))
        }
    }
    return Number(new TokenAmount(quote, val.mul(TENK).toString()).toSignificant(18))

}


export const priceRequiem = (chainId: number, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
    const quoteIs0 = DAI[chainId].address.toLowerCase() < REQT[chainId].address.toLowerCase()
    const key = quoteIs0 ? `${DAI[chainId].address}-${REQT[chainId].address}` : `${REQT[chainId].address}-${DAI[chainId].address}`
    if (!allPairs || !allPairs[key])
        return 0
    const relevantPairs = Object.values(allPairs[key])
    const [prices, totalVal] = quoteIs0 ? [relevantPairs.map(pair => pair.value0 * pair.price0), relevantPairs.map(pair => pair.value0).reduce((a, b) => a + b, 0)] :
        [relevantPairs.map(pair => pair.value1 * pair.price1), relevantPairs.map(pair => pair.value1).reduce((a, b) => a + b, 0)]
    return prices.reduce((a, b) => a + b, 0) / totalVal
}


export const priceAssetBackedRequiem = (chainId: number, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
    const quoteIs0 = DAI[chainId].address.toLowerCase() < ABREQ[chainId].address.toLowerCase()
    const key = quoteIs0 ? `${DAI[chainId].address}-${ABREQ[chainId].address}` : `${ABREQ[chainId].address}-${DAI[chainId].address}`
    if (!allPairs || !allPairs[key])
        return 0
    const relevantPairs = Object.values(allPairs[key])
    const [prices, totalVal] = quoteIs0 ? [relevantPairs.map(pair => pair.value0 * pair.price0), relevantPairs.map(pair => pair.value0).reduce((a, b) => a + b, 0)] :
        [relevantPairs.map(pair => pair.value1 * pair.price1), relevantPairs.map(pair => pair.value1).reduce((a, b) => a + b, 0)]
    return prices.reduce((a, b) => a + b, 0) / totalVal
}

export { }