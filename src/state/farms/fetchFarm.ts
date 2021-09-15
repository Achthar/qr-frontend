import { Farm, FarmNew } from 'state/types'
import {fetchFarm as fetchPublicFarmData} from './fetchPublicFarmData'

export const fetchFarm = async (chainId:number, farm: FarmNew): Promise<FarmNew> => {
  const farmPublicData = await fetchPublicFarmData(chainId, farm)

  return { ...farm, ...farmPublicData }
}

// export default fetchFarm
