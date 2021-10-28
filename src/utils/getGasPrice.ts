// import { ChainId } from '@requiemswap/sdk'
import store from 'state'
import { GAS_PRICE_GWEI } from 'state/user/hooks/helpers'
import { ChainId } from '../config/index'

/**
 * Function to return gasPrice outwith a react component
 */
const getGasPrice = (chainId:number): string => {
  // const chainId = process.env.REACT_APP_CHAIN_ID
  const state = store.getState()
  const userGas = state.user.gasPrice || GAS_PRICE_GWEI[chainId].default
  return chainId === ChainId.BSC_MAINNET ? userGas : GAS_PRICE_GWEI[chainId].testnet
}

export default getGasPrice
