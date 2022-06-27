import { AmplifiedWeightedPair, Token, ZERO } from "@requiemswap/sdk";
import { BigNumber } from "ethers";

const TEN = BigNumber.from(10)

/**
 * note for general pairs the price does not necessarily satisfy the conditon
 * that the lp value consists 50% of the one and the other token since the mid
 * price is the quotient of the reserves. That is not necessarily the case for
 * general pairs, therefore, we have to calculate the price separately and apply it
 * to the reserve amount for conversion
 * - calculates the total liquidity value denominated in the provided token
 * - uses the 1bps ouytput reserves for that calculation to avoid slippage to
 *   have a too large impact
 * - the sencond token input argument is ignored when using pools with only 2 tokens
 * @param _pair general pair that has the RequiemSwap interface implemented
 *  - the value is calculated as the geometric average of input and output
 *  - is consistent with the uniswapV2-type case
 */
function getTotalValue(_pair: AmplifiedWeightedPair, _quote: Token): BigNumber {
    const weight0 = _pair.weight0
    const weight1 = _pair.weight1
    const reserve0 = _pair.reserve0.raw
    const reserve1 = _pair.reserve1.raw
    const vReserve0 = _pair.virtualReserve0.raw
    const vReserve1 = _pair.virtualReserve1.raw

    let _value = ZERO

    // In case of both weights being 50, it is equivalent to
    // the UniswapV2 variant. If the weights are different, we define the valuation by
    // scaling the reserve up or down dependent on the weights and the use the product as
    // adjusted constant product. We will use the conservative estimation of the price - we upscale
    // such that the reflected equivalent pool is a uniswapV2 with the higher liquidity that pruduces
    // the same price of the Requiem token as the weighted pool.
    if (_quote.equals(_pair.token0)) {
        _value = reserve0.add((vReserve0.mul(weight1).mul(reserve1)).div(weight0.mul(vReserve1)))
    } else {
        _value = reserve1.add((vReserve1.mul(weight0).mul(reserve0)).div(weight1.mul(vReserve0)))
    }
    // standardize to 18 decimals
    return _value.mul(TEN.pow(18 - _quote.decimals))
}

/**
 * - calculates the value in QUOTE that backs reqt 1:1 of the input LP amount provided
 * @param _pair general pair that has the RequiemSwap interface implemented
 * @param _amount the amount of LP to price for the backing
 *  - is consistent with the uniswapV2-type case
 */
export function pairValuation(
    _pair: AmplifiedWeightedPair,
    _quote: Token,
    _amount: BigNumber,
    _pairTotalSupply: BigNumber
): BigNumber {
    const totalValue = getTotalValue(_pair, _quote);
    if (_pairTotalSupply.eq(0)) return BigNumber.from(0)
    return totalValue.mul(_amount).div(_pairTotalSupply);
}

// markdown function for bond valuation - no discounting fo regular pairs
export function markdown(
    _pair: AmplifiedWeightedPair,
    _quote: Token,
    _amount: BigNumber): BigNumber {
    return getTotalValue(_pair, _quote);
}

