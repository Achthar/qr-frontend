import { FarmConfig } from 'config/constants/types'
import { ChainId } from '@pancakeswap/sdk'
import fetchFarm from './fetchFarm'

const fetchFarms = async (chainId: number, farmsToFetch: { [chainId in ChainId]: FarmConfig[] }) => {
  const data = await Promise.all(
    farmsToFetch[chainId].map(async (farmConfig) => {
      const farm = await fetchFarm(chainId, farmConfig)
      return farm
    }),
  )
  return data
}

export default fetchFarms