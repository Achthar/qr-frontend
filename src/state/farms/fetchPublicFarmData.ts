/* eslint-disable no-continue */
import { Fraction } from '@requiemswap/sdk'
import BigNumber from 'bignumber.js'
// import masterchefABI from 'config/abi/masterchef.json'
import requiemChefABI from 'config/abi/avax/RequiemChef.json'
import erc20 from 'config/abi/erc20.json'
import { PoolClass } from 'config/constants/types'
import { getAddress, getMasterChefAddress } from 'utils/addressHelpers'
import { BIG_TEN, BIG_ZERO } from 'utils/bigNumber'
import multicall from 'utils/multicall'
import { SerializedFarm, SerializedBigNumber } from '../types'

type PublicFarmData = {
  tokenAmountTotal: SerializedBigNumber
  lpTotalInQuoteToken: SerializedBigNumber
  lpTotalSupply: SerializedBigNumber
  tokenPriceVsQuote: SerializedBigNumber
  poolWeight: SerializedBigNumber
  multiplier: string
  lpTokenRatio: SerializedBigNumber
  tokenAmounts: SerializedBigNumber[]
  lockMaturity: number
}

const getAmounts = (quoteTokenIndex: number, tokenBals: BigNumber[], weights: number[], tokenDecimals: number): {
  tokenAmountTotalInQuote: BigNumber,
  quoteTokenAmountTotal: BigNumber,
  price: BigNumber
} => {

  let tokenAmountTotalInQuote = new BigNumber(0)
  let price = new BigNumber(0)
  const quoteTokenAmountTotal = tokenBals[quoteTokenIndex].div(BIG_TEN.pow(tokenDecimals[quoteTokenIndex]))
  const quoteWeight = weights[quoteTokenIndex]
  for (let i = 0; i < tokenBals.length; i++) {
    if (quoteTokenIndex === i) continue;
    // Raw amount of token in the LP, including those not staked
    const amount = tokenBals[i].div(BIG_TEN.pow(tokenDecimals[i]))
    price = (quoteTokenAmountTotal.multipliedBy(weights[i])).div(amount.multipliedBy(quoteWeight))
    tokenAmountTotalInQuote = tokenAmountTotalInQuote.plus(amount.multipliedBy(price))
  }
  return { tokenAmountTotalInQuote, quoteTokenAmountTotal, price }
}


const fetchFarm = async (farm: SerializedFarm): Promise<PublicFarmData> => {
  const { pid, lpAddresses, tokens } = farm

  const chainId = tokens[0]?.chainId
  const lpAddress = getAddress(chainId, lpAddresses)
  const calls = [
    // lp balance of master
    {
      address: lpAddress,
      name: 'balanceOf',
      params: [getMasterChefAddress(chainId)],
    },
    // Total supply of LP tokens
    {
      address: lpAddress,
      name: 'totalSupply',
    },
    // balances
    ...tokens.map(tok => {
      return {
        address: tok.address,
        name: 'balanceOf',
        params: [farm.poolAddress],
      }
    }),
    // decimals
    ...tokens.map(tok => {
      return {
        address: tok.address,
        name: 'decimals',
        params: [],
      }
    }),
  ]

  const results = await multicall(chainId, erc20, calls)

  const lpTokenBalanceMC = results[0][0]
  const lpTotalSupply = results[1][0]
  const tokenBals = results.slice(2, tokens.length + 2).map(x => x[0])
  const tokenDecimals = results.slice(tokens.length + 2, results.length).map(x => x[0])


  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new BigNumber(lpTokenBalanceMC.toString()).div(new BigNumber(lpTotalSupply.toString()))

  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = new BigNumber(tokenBals[farm.quoteTokenIndex === 0 ? 1 : 0].toString()).div(BIG_TEN.pow(tokenDecimals[farm.quoteTokenIndex === 0 ? 1 : 0]))
  // const quoteTokenAmountTotal = new BigNumber(tokenBals[farm.quoteTokenIndex].toString()).div(BIG_TEN.pow(tokenDecimals[farm.quoteTokenIndex]))

  const {
    tokenAmountTotalInQuote,
    quoteTokenAmountTotal,
    price
  } = getAmounts(farm.quoteTokenIndex, tokenBals.map(x => new BigNumber(x.toString())), farm.weights, tokenDecimals)

  // Amount of quoteToken in the LP that are staked in the MC
  const quoteTokenAmountMc = quoteTokenAmountTotal.times(lpTokenRatio)

  // Total staked in LP, in quote token value
  const lpTotalInQuoteToken = quoteTokenAmountMc.times(new BigNumber(2))

  // Only make masterchef calls if farm has pid
  const [info, totalAllocPoint] =
    pid || pid === 0
      ? await multicall(chainId,
        requiemChefABI, [
        {
          address: getMasterChefAddress(chainId),
          name: 'poolInfo',
          params: [pid],
        },
        {
          address: getMasterChefAddress(chainId),
          name: 'totalAllocPoint',
        },
      ])
      : [null, null]

  const allocPoint = info ? new BigNumber(info.allocPoint?.toString()) : BIG_ZERO
  const poolWeight = totalAllocPoint ? allocPoint.div(new BigNumber(totalAllocPoint)) : BIG_ZERO


  return {
    tokenAmountTotal: tokenAmountTotal.toJSON(),
    lpTotalSupply: new BigNumber(lpTotalSupply.toString()).toJSON(),
    lpTotalInQuoteToken: tokenAmountTotalInQuote.toJSON(),
    tokenPriceVsQuote: farm.poolClass === PoolClass.PAIR ? price.toJSON() : undefined,
    poolWeight: poolWeight.toJSON(),
    multiplier: `${allocPoint.div(100).toString()}X`,
    lpTokenRatio: new Fraction(lpTokenBalanceMC, lpTotalSupply).toSignificant(18),
    tokenAmounts: tokenBals.map(bal => bal.toString()),
    lockMaturity: Number(info.maturity.toString())
  }
}

export default fetchFarm
