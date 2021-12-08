
import { JSBI, Token, WeightedPair } from '@requiemswap/sdk'

// calculates the addresses for pair over a variety of weights an fees
export function weightedPairAddresses(tokenA: Token, tokenB: Token, weightsA: number[], fees: number[]): { [id: string]: string } {
    const dict = {}
    for (let i = 0; i < weightsA.length; i++) {
        for (let j = 0; j < fees.length; j++) {
            dict[`${String(weightsA[i])}-${String(fees[j])}`] = WeightedPair.getAddress(tokenA, tokenB, JSBI.BigInt(weightsA[i]), JSBI.BigInt(fees[j]))
        }
    }
    return dict
}