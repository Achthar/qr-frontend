import { ChainId } from '@requiemswap/sdk'
import { abi as DaiBondContract } from 'config/abi/DaiBondContract.json'
import { ethers } from 'ethers'
import tokens from './tokens'
import { BondConfig, BondType } from './types'


export const bondList: { [chainId in ChainId]?: BondConfig[] } = {
  [ChainId.AVAX_TESTNET]: [
    {
      bondId: 0,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "REQT",
      displayName: "REQT",
      bondToken: "CVX",
      payoutToken: "OHM",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.StableAsset,
      displayUnits: '4',
      bondAddress: {
        43114: "0x767e3459A35419122e5F6274fB1223d75881E0a9",
        43113: "0xd43940687f6e76056789d00c43A40939b7a559b5"
      },
      reserveAddress: {
        43114: "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
        43113: "0xB2180448f8945C8Cc8AE9809E67D6bd27d8B2f2C"
      }
    }
  ],
  [ChainId.BSC_TESTNET]: [],
  [ChainId.MATIC_MAINNET]: [],
  [ChainId.AVAX_MAINNET]: [],
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: []
}
