import { FarmConfig, FarmConfigNew } from 'config/constants/types'
import {fetchFarm,} from './fetchFarm'


export const fetchFarms = async (chainId:number, farmsToFetch: { [chainId: number]: FarmConfigNew[] }) => {
  const data = await Promise.all(
    farmsToFetch[chainId].map(async (farmConfig) => {
      const farm = await fetchFarm(chainId, farmConfig)
      return farm
    }),
  )
  return data
}

// export default fetchFarms
