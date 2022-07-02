import { AmplifiedWeightedPair, Token, TokenAmount } from "@requiemswap/sdk"
import { BondConfig, SerializedToken } from "config/constants/types"
import { BigNumber, ethers } from "ethers"
import { Bond, CallableBond, CallableNote, CallBond, CallNote, ClosedCallableTerms, ClosedCallBond, ClosedCallTerms, ClosedVanillaBond, ClosedVanillaMarket, SerializedWeightedPair, VanillaNote } from "state/types"
import { deserializeToken } from "state/user/hooks/helpers"

const ONE18 = ethers.BigNumber.from('1000000000000000000')
const ZERO = ethers.BigNumber.from('0')
/**
 * Gets the quote token from bond
 */
export const getQuoteToken = (bond: BondConfig): SerializedToken => {
    return bond.tokens[bond.quoteTokenIndex]
}

/**
 * Gets the first non-quote token from a bond
 */
export const getNonQuoteToken = (bond: BondConfig): SerializedToken => {
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
export const priceBonding = (amount: BigNumber, bond: Bond | CallBond | CallableBond): ethers.BigNumber => {
    if (!bond || !bond.market || !bond.purchasedInQuote) return ethers.BigNumber.from(0)
    return amount.mul(bond.purchasedInQuote).div(bond.market.purchased)
}

export const calculatePayoff = (
    _initialPrice: ethers.BigNumber,
    _priceNow: ethers.BigNumber,
    _strike: ethers.BigNumber
): ethers.BigNumber => {
    const _kMinusS = ethers.BigNumber.from(_priceNow).mul(ONE18).sub((ONE18.add(_strike).mul(_initialPrice)));
    return _kMinusS.div(_initialPrice);
}

export const calculateUserPay = (note: CallNote | CallableNote, bond: CallBond | CallableBond, _priceNow: string): { moneyness: number, pay: ethers.BigNumber } => {
    const strike = ethers.BigNumber.from(bond.bondTerms.thresholdPercentage)
    const payoff = calculatePayoff(ethers.BigNumber.from(note.cryptoIntitialPrice), ethers.BigNumber.from(_priceNow), strike)
    const moneyness = Number(ethers.utils.formatEther(payoff))
    if (payoff.lt(0)) return { moneyness, pay: ZERO }

    return { moneyness, pay: (payoff.gt(strike) ? ethers.BigNumber.from(bond.bondTerms.payoffPercentage) : payoff).mul(note.payout).div(ONE18) };
}

export const calculateUserPayClosed = (note: CallNote | CallableNote, terms: ClosedCallTerms | ClosedCallableTerms, _priceNow: string): { moneyness: number, pay: ethers.BigNumber } => {
    if (!terms || !note) return { moneyness: 0, pay: ZERO }

    const strike = ethers.BigNumber.from(terms.thresholdPercentage)
    const payoff = calculatePayoff(ethers.BigNumber.from(note.cryptoIntitialPrice), ethers.BigNumber.from(_priceNow), strike)
    const moneyness = Number(ethers.utils.formatEther(payoff))
    if (payoff.lt(0)) return { moneyness, pay: ZERO }

    const perc = ethers.BigNumber.from('ClosedCallTerms' in terms ? (terms as ClosedCallTerms).payoffPercentage : (terms as ClosedCallableTerms).maxPayoffPercentage)
    return { moneyness, pay: (payoff.gt(strike) ? perc : payoff).mul(note.payout).div(ONE18) };
}


export const getConfigForVanillaNote = (chainId: number, note: VanillaNote | CallableNote | CallNote, bonds: { [bid: number]: ClosedVanillaBond }, bondCfgs: BondConfig[]) => {
    if (Object.values(bonds).length === 0 || !note) return null
    try {
        return bondCfgs.find(cfg => ethers.utils.getAddress(cfg.reserveAddress[chainId]) === ethers.utils.getAddress(bonds[note.marketId]?.market?.asset))
    } catch {
        return null
    }
}