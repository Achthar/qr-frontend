import { FarmConfig, ChainGroup } from 'config/constants/types'
import fetchFarm from './fetchFarm'

const fetchFarms = async (chainId:number, farmsToFetch: {[chainGroup in ChainGroup]:FarmConfig[]}) => {
  const data = await Promise.all(
    farmsToFetch[chainId].map(async (farmConfig) => {
      const farm = await fetchFarm(chainId, farmConfig)
      return farm
    }),
  )
  return data
}

export default fetchFarms