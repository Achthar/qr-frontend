import { BondConfig } from 'config/constants/types'
import { ChainId } from '@requiemswap/sdk'
import fetchBond from './fetchBond'

const calcBondDetails = async (chainId: number, bondsToFetch: { [chainId in ChainId]?: BondConfig[] }) => {
  const data = await Promise.all(
    bondsToFetch[chainId].map(async (bondConfig) => {
      const bond = await fetchBond(chainId, bondConfig)
      return bond
    }),
  )
  return data
}

export default calcBondDetails