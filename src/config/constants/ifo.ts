import tokens from './tokens'
import farms from './farms'
import { Ifo, SerializedToken } from './types'

const cakeBnbLpToken: SerializedToken = {
  chainId: 0,
  symbol: farms(43113)[1].lpSymbol,
  address: farms(43113)[1].lpAddresses[0],
  decimals: 18,
}

const ifos: Ifo[] = [
  {
    id: 'kalmar',
    address: '0x1aFB32b76696CdF05593Ca3f3957AEFB23a220FB',
    isActive: true,
    name: 'Kalmar (KALM)',
    poolBasic: {
      saleAmount: '375,000 KALM',
      raiseAmount: '$750,000',
      cakeToBurn: '$375,000',
      distributionRatio: 0.3,
    },
    poolUnlimited: {
      saleAmount: '875,000 KALM',
      raiseAmount: '$2,500,000',
      cakeToBurn: '$1,250,000',
      distributionRatio: 0.7,
    },
    currency: cakeBnbLpToken,
    token: null,
    releaseBlockNumber: 7707736,
    campaignId: '511110000',
    articleUrl: 'https://pancakeswap.medium.com/kalmar-kalm-ifo-to-be-hosted-on-pancakeswap-4540059753e4',
    tokenOfferingPrice: 2.0,
    version: 2,
  },
]

export default ifos
