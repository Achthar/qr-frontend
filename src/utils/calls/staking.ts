import BigNumber from 'bignumber.js'
import { DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import getGasPrice from 'utils/getGasPrice'

const options = {
    gasLimit: DEFAULT_GAS_LIMIT,
}

// staking functions
export const stake = async (chainId, stakingContract, to, amount, rebasing, claim) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await stakingContract.stake(to, amount, rebasing, claim, { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
}

export const unstake = async (chainId, stakingContract, to, amount, trigger, rebasing) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await stakingContract.unstake(to, amount, trigger, rebasing, { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
}

// wrap functions
export const wrap = async (chainId, stakingContract, to, amount) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await stakingContract.wrap(to, amount, { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
}

export const unwrap = async (chainId, stakingContract, to, amount) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await stakingContract.unwrap(to, amount, { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
}
