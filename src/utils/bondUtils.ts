import { AmplifiedWeightedPair, Token, TokenAmount } from "@requiemswap/sdk"
import { SerializedToken } from "config/constants/types"
import { BigNumber, ethers } from "ethers"
import { Bond, CallBond, SerializedWeightedPair } from "state/types"
import { deserializeToken } from "state/user/hooks/helpers"

/**
 * Gets the quote token from bond
 */
export const getQuoteToken = (bond: Bond): SerializedToken => {
    return bond.tokens[bond.quoteTokenIndex]
}

/**
 * Gets the first non-quote token from a bond
 */
export const getNonQuoteToken = (bond: Bond): SerializedToken => {
    const index = bond.quoteTokenIndex === 0 ? 1 : 0
    return bond.tokens[index]
}

/**
 * Convert pair interface object to class object
 * @param serializedPair input pair
 * @returns weighted pair
 */
export const deserializeWeightedPair = (serializedPair: SerializedWeightedPair): AmplifiedWeightedPair => {

    return new AmplifiedWeightedPair(
        [deserializeToken(serializedPair.token0), deserializeToken(serializedPair.token1)],
        [ethers.BigNumber.from(serializedPair.reserve0), ethers.BigNumber.from(serializedPair.reserve1)],
        [ethers.BigNumber.from(serializedPair.vReserve0), ethers.BigNumber.from(serializedPair.vReserve1)],
        ethers.BigNumber.from(serializedPair.weight0),
        ethers.BigNumber.from(serializedPair.fee),
        ethers.BigNumber.from(serializedPair.amp),
        ethers.utils.getAddress(serializedPair.address))
}

/**
 * Price an input amount with bond - assumes that bond has all data loaded
 */
export const priceBonding = (amount: BigNumber, bond: Bond | CallBond): ethers.BigNumber => {
    if (!bond || !bond.market || !bond.purchasedInQuote) return ethers.BigNumber.from(0)
    return amount.mul(bond.purchasedInQuote).div(bond.market.purchased)
}