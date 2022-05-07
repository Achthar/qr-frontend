import BigNumber from 'bignumber.js'
import { BLOCKS_PER_YEAR, REWARD_PER_YEAR } from 'config'
import lpAprs from 'config/constants/lpAprs.json'

/**
 * Get the APR value in %
 * @param stakingTokenPrice Token price in the same quote currency
 * @param rewardTokenPrice Token price in the same quote currency
 * @param totalStaked Total amount of stakingToken in the pool
 * @param tokenPerBlock Amount of new reqt allocated to the pool for each new block
 * @returns Null if the APR is NaN or infinite.
 */
export const getPoolApr = (
  stakingTokenPrice: number,
  rewardTokenPrice: number,
  totalStaked: number,
  tokenPerBlock: number,
): number => {
  const totalRewardPricePerYear = new BigNumber(rewardTokenPrice).times(tokenPerBlock).times(BLOCKS_PER_YEAR)
  const totalStakingTokenInPool = new BigNumber(stakingTokenPrice).times(totalStaked)
  const apr = totalRewardPricePerYear.div(totalStakingTokenInPool).times(100)
  return apr.isNaN() || !apr.isFinite() ? null : apr.toNumber()
}

/**
 * Get farm APR value in %
 * @param poolWeight allocationPoint / totalAllocationPoint
 * @param reqtPriceUsd Cake price in USD
 * @param poolLiquidityUsd Total pool liquidity in USD
 * @returns
 */
export const getFarmApr = (
  poolWeight: BigNumber,
  reqtPriceUsd: BigNumber,
  poolLiquidityUsd: BigNumber,
  farmAddress: string,
): { reqtRewardsApr: number; lpRewardsApr: number } => {
  const yearlyRewardAllocation = REWARD_PER_YEAR.times(poolWeight)

  const reqtRewardsApr = yearlyRewardAllocation.times(reqtPriceUsd).div(poolLiquidityUsd).times(100)
  
  let reqtRewardsAprAsNumber = null
  if (!reqtRewardsApr.isNaN() && reqtRewardsApr.isFinite()) {
    reqtRewardsAprAsNumber = reqtRewardsApr.toNumber()
  }
  const lpRewardsApr = lpAprs[farmAddress?.toLocaleLowerCase()] ?? 0

  return { reqtRewardsApr: reqtRewardsAprAsNumber, lpRewardsApr }
}

/**
 * Get farm APR value in %
 * @param poolWeight allocationPoint / totalAllocationPoint
 * @param reqtPriceUsd Cake price in USD
 * @param poolLiquidityUsd Total pool liquidity in USD
 * @returns
 */
export const getBondApr = (
  poolWeight: BigNumber,
  reqtPriceUsd: BigNumber,
  poolLiquidityUsd: BigNumber,
  farmAddress: string,
): { reqtRewardsApr: number; lpRewardsApr: number } => {
  const yearlyRewardAllocation = REWARD_PER_YEAR.times(poolWeight)
  const reqtRewardsApr = yearlyRewardAllocation.times(reqtPriceUsd).div(poolLiquidityUsd).times(100)
  let reqtRewardsAprAsNumber = null
  if (!reqtRewardsApr.isNaN() && reqtRewardsApr.isFinite()) {
    reqtRewardsAprAsNumber = reqtRewardsApr.toNumber()
  }
  const lpRewardsApr = lpAprs[farmAddress?.toLocaleLowerCase()] ?? 0

  return { reqtRewardsApr: reqtRewardsAprAsNumber, lpRewardsApr }
}

export default null
