
import { JSBI, Token, WeightedPair } from '@requiemswap/sdk'
import { WeightedPairShell } from 'config/constants/index'


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

// calculates the addresses for pair over a variety of weights an fees
export function weightedPairShellGenerator(tokenA: Token, tokensB: Token[], weightsA: number[], fees: number[], identifier: string): WeightedPairShell[] {
    const dict: WeightedPairShell[] = []
    for (let i = 0; i < weightsA.length; i++) {
        for (let j = 0; j < fees.length; j++) {
            for (let k = 0; k < tokensB.length; k++) {
                dict.push({
                    tokenA, tokenB: tokensB[k], weightA: weightsA[i], fee: fees[j],
                    address: WeightedPair.getAddress(tokenA, tokensB[k], JSBI.BigInt(weightsA[i]), JSBI.BigInt(fees[j]))
                })
            }
        }
    }
    return dict
}

// calculates the addresses for pair over a variety of weights an fees
export function weightedPairShellGeneratorAll( tokens: [Token, Token][], weightsA: number[], fees: number[]): WeightedPairShell[] {
    const dict: WeightedPairShell[] = []
    for (let i = 0; i < weightsA.length; i++) {
        for (let j = 0; j < fees.length; j++) {
            for (let k = 0; k < tokens.length; k++) {
                dict.push({
                    tokenA:tokens[k][0], tokenB: tokens[k][1], weightA: weightsA[i], fee: fees[j],
                    address: WeightedPair.getAddress(tokens[k][0], tokens[k][1], JSBI.BigInt(weightsA[i]), JSBI.BigInt(fees[j]))
                })
            }
        }
    }
    return dict
}