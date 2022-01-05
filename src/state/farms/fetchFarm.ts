import { SerializedFarm } from 'state/types'
import fetchPublicFarmData from './fetchPublicFarmData'

const fetchFarm = async (farm: SerializedFarm): Promise<SerializedFarm> => {
  const farmPublicData = await fetchPublicFarmData(farm)
  console.log("FETCHFARMPUBLIC")
  return { ...farm, ...farmPublicData }
}

export default fetchFarm
