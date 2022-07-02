import { CurrencyAmount, Fraction, Percent, Pool, Price, TokenAmount, Swap, AmplifiedWeightedPair, Token, PoolType, PoolDictionary } from '@requiemswap/sdk'
import { BigNumber } from 'ethers'
import { wrappedCurrency, wrappedCurrencyAmount } from 'utils/wrappedCurrency'
import {
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_LOW,
  ALLOWED_PRICE_IMPACT_MEDIUM,
} from '../config/constants'

import { Field } from '../state/swapV3/actions'
import { basisPointsToPercent } from './index'

const BASE_FEE = new Percent(BigNumber.from(25), BigNumber.from(10000))
const ONE_HUNDRED_PERCENT = new Percent(BigNumber.from(10000), BigNumber.from(10000))
const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE)

// computes price breakdown for the trade
export function computeTradeV3PriceBreakdown(trade?: Swap | null, poolDict?: PoolDictionary): {
  priceImpactWithoutFee: Percent | undefined
  realizedLPFee: CurrencyAmount | undefined | null
} {
  // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
  // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
  const realizedLPFee = !trade
    ? undefined
    : ONE_HUNDRED_PERCENT.subtract(
      trade.route.swapData.reduce<Fraction>(
        (currentFee: Fraction): Fraction => currentFee.multiply(INPUT_FRACTION_AFTER_FEE),
        ONE_HUNDRED_PERCENT,
      ),
    )
  // const price = calculatePoolPrice(trade)
  let poolPrice
  if (trade) {
    if (!trade.route.swapData[0].priceBaseIn)
      trade.route.swapData[0].fetchPoolPrice(poolDict)

    poolPrice = trade && new Price(trade.route.swapData[0].tokenIn, trade.route.swapData[0].tokenOut, trade.route.swapData[0].priceBaseIn, trade.route.swapData[0].priceBaseOut)


    for (let i = 1; i < trade.route.swapData.length; i++) {
      if (!trade.route.swapData[i].priceBaseIn)
        trade.route.swapData[i].fetchPoolPrice(poolDict)

      poolPrice = poolPrice.multiply(
        new Price(trade.route.swapData[i].tokenIn, trade.route.swapData[i].tokenOut, trade.route.swapData[i].priceBaseIn, trade.route.swapData[i].priceBaseOut)
      )

    }
  }

  // remove lp fees from price impact
  // const priceImpactWithoutFeeFraction = poolPrice // trade && realizedLPFee ? trade.priceImpact.subtract(realizedLPFee) : undefined

  const res = (Number(poolPrice?.toSignificant(18)) - Number(trade?.executionPrice?.toSignificant(18))) / Number(poolPrice?.toSignificant(18))

  // the x*y=k impact
  // const priceImpactWithoutFeePercent = priceImpactWithoutFeeFraction
  //   ? new Percent(priceImpactWithoutFeeFraction?.numerator, priceImpactWithoutFeeFraction?.denominator)
  //   : undefined

  // the amount of the input that accrues to LPs
  const realizedLPFeeAmount =
    realizedLPFee &&
    trade && new TokenAmount(trade.inputAmount.token, realizedLPFee.multiply(trade.inputAmount.raw).quotient)


  return { priceImpactWithoutFee: res ? new Percent(String(Math.round(res * 100000000)), String(100000000)) : undefined, realizedLPFee: realizedLPFeeAmount }
}

// computes the minimum amount out and maximum amount in for a trade given a user specified allowed slippage in bips
export function computeSlippageAdjustedAmountsV3(
  trade: Swap | undefined,
  allowedSlippage: number,
): { [field in Field]?: CurrencyAmount } {
  const pct = basisPointsToPercent(allowedSlippage)
  return {
    [Field.INPUT]: trade?.maximumAmountIn(pct),
    [Field.OUTPUT]: trade?.minimumAmountOut(pct),
  }
}

export function warningSeverity(priceImpact: Percent | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!priceImpact?.lessThan(BLOCKED_PRICE_IMPACT_NON_EXPERT)) return 4
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_HIGH)) return 3
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_MEDIUM)) return 2
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_LOW)) return 1
  return 0
}

export function formatExecutionPriceV3(trade?: Swap, inverted?: boolean): string {
  if (!trade) {
    return ''
  }
  return inverted
    ? `${trade.executionPrice.invert().toSignificant(6)} ${trade.inputAmount.currency.symbol} / ${trade.outputAmount.currency.symbol
    }`
    : `${trade.executionPrice.toSignificant(6)} ${trade.outputAmount.currency.symbol} / ${trade.inputAmount.currency.symbol
    }`
}

function defaultPrice(token0: Token, token1: Token) {
  return new Price(token0, token1, String(10 ** token0.decimals), String(10 ** token1.decimals))
}

// calculates the pool price using stable pool matrices as ref
export function calculatePoolPrice(trade?: Swap, poolDict?: PoolDictionary): Price {
  if (!trade || !poolDict)
    return null
  const pools = trade.route.swapData
  const path = trade.route.path
  let price = pools[0].poolPrice(poolDict)
  for (let i = 1; i < pools.length; i++) {
    price = pools[i].poolPrice(poolDict)
  }
  return price
}