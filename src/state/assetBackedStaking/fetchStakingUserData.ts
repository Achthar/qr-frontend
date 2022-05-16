/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import multicall from 'utils/multicall';
import staking from 'config/abi/avax/Staking.json'
import sRequiem from 'config/abi/avax/sRequiem.json'
import { getAssetBackedStakingAddress } from 'utils/addressHelpers';
import { GREQ, SREQ } from 'config/constants/tokens';


export interface AssetBackedStakingUserRequest {
  chainId: number
  account: string
}

export const fetchStakingUserData = createAsyncThunk(
  "assetBackedStaking/fetchStakingUserData",
  async ({ chainId, account }: AssetBackedStakingUserRequest): Promise<any> => {

    // const assetBackedstakingContract = getAssetBackedStakingContract(chainId)
    const stakingAddress = getAssetBackedStakingAddress(chainId)

    // calls for general bond data
    const calls = [
      // seconds to next epoch
      {
        address: stakingAddress,
        name: 'warmupInfo',
        params: [account]
      },
    ]

    const [warmupInfo] =
      await multicall(chainId, staking, calls)


    const sREQAddress = SREQ[chainId].address
    const gREQAddress = GREQ[chainId].address

    // calls for general bond data
    const callsBalances = [
      // sreq
      {
        address: sREQAddress,
        name: 'balanceOf',
        params: [account]
      },
      // greq
      {
        address: gREQAddress,
        name: 'balanceOf',
        params: [account]
      },

    ]
    const [balanceSReq, balanceGReq] =
      await multicall(chainId, sRequiem, callsBalances)


    return {
      warmupInfo: {
        deposit: warmupInfo.deposit.toString(), // if forfeiting
        gons: warmupInfo.gons.toString(), // staked balance
        expiry: warmupInfo.expiry.toString(), // end of warmup period
        lock: warmupInfo.lock, // prevents malicious delays for claim
        sReqBalance: balanceSReq[0].toString(),
        gReqBalance: balanceGReq[0].toString()
      }
    };
  },
);