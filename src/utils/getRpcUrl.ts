import sample from 'lodash/sample'
import { ChainId } from '../config/index'

// Array of available nodes to connect to
export const nodesBSC = [
  process.env.REACT_APP_NODE_BSC_1,
  process.env.REACT_APP_NODE_BSC_2,
  process.env.REACT_APP_NODE_BSC_3,
]
export const nodesBSCT = [
  process.env.REACT_APP_NODE_BSCT_1,
  process.env.REACT_APP_NODE_BSCT_2,
  process.env.REACT_APP_NODE_BSCT_3,
]

export const nodes :{ [chainId: number]: string } ={
  [ChainId.TESTNET_BSC]: sample(nodesBSCT),
  [ChainId.MAINNET_BSC]: sample(nodesBSC)
}

const getNodeUrl = (chainId) => {
  let node = ''
  if (chainId === '54') {
    node = sample(nodesBSC)
  } else if (chainId === '97') {
    node = sample(nodesBSCT)
  } else {
    node = sample(nodesBSC) // default
  }
  return node
}

export default getNodeUrl
