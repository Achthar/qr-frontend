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
      name: "80% REQT - 20% DAI",
      displayName: "80% REQT - 20% DAI",
      bondToken: "DAI REQT LP",
      payoutToken: "REQT",
      bondIconSvg: 'CvxImg',
      // bondContractABI: new ethers.utils.Interface(DaiBondContract),
      // reserveContract: '',
      type: BondType.LP,
      displayUnits: '4',
      bondAddress: {
        43114: "0x767e3459A35419122e5F6274fB1223d75881E0a9",
        43113: "0xd43940687f6e76056789d00c43A40939b7a559b5"
      },
      reserveAddress: {
        43114: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c",
        43113: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c"
      }
    },
    {
      bondId: 1,
      isBondable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isClaimable: {
        [ChainId.AVAX_TESTNET]: true,
        [ChainId.AVAX_MAINNET]: false
      },
      isLP: false,
      name: "REQT SLP",
      displayName: "REQT - Stable LP",
      bondToken: "Stable Swap LP",
      payoutToken: "REQT",
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
        43114: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c",
        43113: "0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c"
      }
    }
  ],
  [ChainId.BSC_TESTNET]: [],
  [ChainId.MATIC_MAINNET]: [],
  [ChainId.AVAX_MAINNET]: [],
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: []
}
