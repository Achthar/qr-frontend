import BigNumber from 'bignumber.js'
import { getCakeVaultContract } from 'utils/contractHelpers'

// const cakeVaultContract = getCakeVaultContract()

const fetchVaultUser = async (chainId:number, account: string) => {
  try {
    const userContractResponse = await getCakeVaultContract(chainId).userInfo(account)
    return {
      isLoading: false,
      userShares: new BigNumber(userContractResponse.shares.toString()).toJSON(),
      lastDepositedTime: userContractResponse.lastDepositedTime.toString(),
      lastUserActionTime: userContractResponse.lastUserActionTime.toString(),
      cakeAtLastUserAction: new BigNumber(userContractResponse.cakeAtLastUserAction.toString()).toJSON(),
    }
  } catch (error: any) {
    return {
      isLoading: true,
      userShares: null,
      lastDepositedTime: null,
      lastUserActionTime: null,
      cakeAtLastUserAction: null,
    }
  }
}

export default fetchVaultUser
