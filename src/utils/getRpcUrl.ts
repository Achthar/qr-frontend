import sample from 'lodash/sample'
import NETWORK_URLS from 'config/constants/networks'
import { ChainId } from '../config/index'

// Array of available nodes to connect to
export const nodesBSC = [

  process.env.REACT_APP_NODE_BSC_1,
  process.env.REACT_APP_NODE_BSC_2,
  process.env.REACT_APP_NODE_BSC_3,
  /*
  process.env.REACT_APP_NODE_BSC_4,
  process.env.REACT_APP_NODE_BSC_5,
  process.env.REACT_APP_NODE_BSC_6,
  */
]
export const nodesBSCT = [
  process.env.REACT_APP_NODE_BSCT_1,
  process.env.REACT_APP_NODE_BSCT_2,
  process.env.REACT_APP_NODE_BSCT_3,
]

export const nodesMATICT =
  [
    // process.env.REACT_APP_NODE_MATICT + process.env.MATIC_INFURA_KEY,
    process.env.REACT_APP_RPC_URL_MATICT
  ]

export const nodesAVAXT =
  [
    process.env.REACT_APP_RPC_URL_AVAXT
  ]

export const nodesAVAX =
  [
    process.env.REACT_APP_RPC_URL_AVAX
  ]

export const nodesOASIST = [
  NETWORK_URLS[ChainId.OASIS_TESTNET]
]

export const nodesQuarkChain = [
  NETWORK_URLS[ChainId.QUARKCHAIN_DEV_S0]
]


export const nodes: { [chainId: number]: string } = {
  [ChainId.BSC_TESTNET]: sample(nodesBSCT),
  [ChainId.BSC_MAINNET]: sample(nodesBSC),
  [ChainId.MATIC_TESTNET]: nodesMATICT[0],
  [ChainId.AVAX_TESTNET]: nodesAVAXT[0],
  [ChainId.OASIS_TESTNET]: nodesOASIST[0],
  [ChainId.QUARKCHAIN_DEV_S0]: nodesQuarkChain[0]
}

const getNodeUrl = (chainId) => {
  let node = ''
  if (chainId === '56' || chainId === 56) {
    node = sample(nodesBSC)
  }
  else if (chainId === '97' || chainId === 97) {
    node = sample(nodesBSCT)
  }
  else if (chainId === '80001' || chainId === 80001) {
    node = nodesMATICT[0]
  }
  else if (chainId === '43113' || chainId === 43113) {
    node = nodesAVAXT[0]
  }
  else if (chainId === '43114' || chainId === 43114) {
    node = nodesAVAX[0]
  }
  else if (chainId === '42261' || chainId === 42261) {
    node = nodesOASIST[0]
  }
  else if (chainId === '110001' || chainId === 110001) {
    node = nodesQuarkChain[0]
  }
  else {
    node = sample(nodesBSC) // default
  }
  return node
}

export default getNodeUrl
