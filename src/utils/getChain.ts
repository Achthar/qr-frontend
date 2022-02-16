
export const CHAIN_DICT = {
  43113: 'avax-test',
  43114: 'avax',
  42261: 'oasis-test'
}
/**
 * Function to return chain outwith a react component
 */
const getChain = (chainId: number): string => {
  return CHAIN_DICT[chainId ?? 43113]
}

export default getChain
