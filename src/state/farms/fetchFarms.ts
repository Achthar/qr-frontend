import { FarmConfig } from 'config/constants/types'
import fetchFarm from './fetchFarm'

const fetchFarms = async (chainId:number, farmsToFetch: FarmConfig[]) => {
  const data = await Promise.all(
    farmsToFetch.map(async (farmConfig) => {
      const farm = await fetchFarm(chainId, farmConfig)
      return farm
    }),
  )
  return data
}

export default fetchFarms
