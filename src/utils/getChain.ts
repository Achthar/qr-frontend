// import { ChainId } from '@requiemswap/sdk'
import store from 'state'
import { GAS_PRICE_GWEI } from 'state/user/hooks/helpers'
import { ChainId } from '../config/index'

export const CHAIN_DICT = {
  43113: 'avax-test',
  43114: 'avax',
}
/**
 * Function to return chain outwith a react component
 */
const getChain = (chainId: number): string => {
  return CHAIN_DICT[chainId ?? 43113]
}

export default getChain
