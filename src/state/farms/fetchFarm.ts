import { Farm } from 'state/types'
import fetchPublicFarmData from './fetchPublicFarmData'

const fetchFarm = async (chainId:number, farm: Farm): Promise<Farm> => {
  const farmPublicData = await fetchPublicFarmData(chainId, farm)

  return { ...farm, ...farmPublicData }
}

export default fetchFarm
