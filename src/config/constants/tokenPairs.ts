import { getAddress } from "ethers/lib/utils"
import { tokenList } from "./tokenLists/tokenlist"
import { SerializedToken, TokenPair } from "./types"

const getTokenList = (chainId: number) => {
    return tokenList[chainId].tokens
}

// gets all token pairs from list 
// vaidates the addresses in a separate instance
// so that these can be used as keys for dictionaries
export const getAllTokenPairs = (chainId: number) => {
    const tokens = getTokenList(chainId)
    const basePairList: TokenPair[] = []
    for (let i = 0; i < tokens.length; i++) {
        for (let k = i + 1; k < tokens.length; k++) {
            basePairList.push(
                tokens[i].address.toLowerCase() < tokens[k].address.toLowerCase() ?
                    {
                        token0: {
                            ...tokens[i],
                             address: getAddress(tokens[i].address)
                        },
                        token1: {
                            ...tokens[k],
                             address: getAddress(tokens[k].address)
                        }
                    } : {
                        token1: {
                            ...tokens[i],
                             address: getAddress(tokens[i].address)
                        },
                        token0: {
                            ...tokens[k],
                             address: getAddress(tokens[k].address)
                        }
                    }
            )
        }
    }
    return basePairList

}

