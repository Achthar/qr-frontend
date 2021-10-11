import { ChainId } from "config"
import { Currency, Token, CurrencyAmount } from "@pancakeswap/sdk"
import { useCurrency } from 'hooks/Tokens'
import { STABLES } from 'config/constants/tokens'

export function stableCCYs(chainId: number): Currency[] {
    return STABLES[chainId].map((token) => {
        return useCurrency(chainId, token.address)
    });
}