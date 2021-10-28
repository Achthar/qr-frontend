import { Currency, STABLECOINS } from "@requiemswap/sdk"
import { useCurrency } from 'hooks/Tokens'

export function stableCCYs(chainId: number): Currency[] {
    return STABLECOINS[chainId].map((token) => {
        return useCurrency(chainId, token.address)
    });
}