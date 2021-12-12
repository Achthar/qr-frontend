import { Bond } from 'state/types'
import fetchPublicBondData, {PublicBondData} from './fetchPublicBondData'

const fetchBond = async (chainId: number, bond: Bond): Promise<PublicBondData> => {
  const bondPublicData = await fetchPublicBondData(chainId, bond)
  return { ...bond, ...bondPublicData }
}

export default fetchBond