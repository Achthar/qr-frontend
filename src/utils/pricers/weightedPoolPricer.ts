/**
 * Bonding calculator for stable pool
 */

import { WeightedPool, Token } from "@requiemswap/sdk";
import { BigNumber } from "ethers";

const TENK = BigNumber.from(1e4)
const TEN = BigNumber.from(10)
// calculates the liquidity value denominated in the provided token
// uses the 0.01% inputAmount for that calculation
// note that we never use the actual LP as input as the swap contains the LP address
// and is also used to extract the balances
export function getTotalValue(_swap: WeightedPool, _quote: Token): BigNumber {
    let _value = BigNumber.from(0)
    const tokens = _swap.tokens;
    const reserves = _swap.tokenBalances;
    for (let i = 0; i < reserves.length; i++) {
        const token = tokens[i];
        if (!token.equals(_quote)) {
            _value = _value.add(_swap.calculateSwapGivenIn(token, _quote, reserves[i].div(TENK)).mul(TENK))
        } else {
            _value = _value.add(reserves[i]);
        }
    }

    return _value.mul(TEN.pow(18 - _quote.decimals))
}

export function weightedPoolValuation(
    _swap: WeightedPool,
    _quote: Token,
    _amount: BigNumber,
    _supply: BigNumber
): BigNumber {
    const totalValue = getTotalValue(_swap, _quote);
    return totalValue.mul(_amount).div(_supply);
}

export function markdown(_swap: WeightedPool, _quote: Token): BigNumber {
    return getTotalValue(_swap, _quote);
}

