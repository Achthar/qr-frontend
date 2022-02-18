import { tokenList } from "./tokenLists/tokenlist"
import { TokenPair } from "./types"

const getTokenList = (chainId: number) => {
    return tokenList[chainId].tokens
}

export const getAllTokenPairs = (chainId: number) => {
    const tokens = getTokenList(chainId)

    const basePairList: TokenPair[] = []
    for (let i = 0; i < tokens.length; i++) {
        for (let k = i + 1; k < tokens.length; k++) {
            basePairList.push(
                tokens[i].address.toLowerCase() < tokens[k].address.toLowerCase() ?
                    {
                        token0: tokens[i],
                        token1: tokens[k]
                    } : {
                        token0: tokens[k],
                        token1: tokens[i]
                    }
            )
        }
    }
    return basePairList

}