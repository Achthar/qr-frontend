/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { ethers, BigNumber } from 'ethers'
import multicall from 'utils/multicall';
import abReqStaking from 'config/abi/avax/Staking.json'
import { Fraction, JSBI, TokenAmount, WeightedPair } from '@requiemswap/sdk';
import { getAssetBackedStakingAddress, getGovernanceRequiemAddress, getRedRequiemAddress, getRedRequiemStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';
import { getAssetBackedStakingContract } from 'utils/contractHelpers';


const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export function bnParser(bn: BigNumber, decNr: BigNumber) {
  return Number((new Fraction(JSBI.BigInt(bn.toString()), JSBI.BigInt(decNr.toString()))).toSignificant(18))
}

export interface AssetBackedStakingUserRequest {
  chainId: number
  account: string
}

// export interface GovernanceLock {
//   amount: SerializedBigNumber
//   end: number
//   minted: SerializedBigNumber
//   multiplier: SerializedBigNumber
// }

// export interface AssetBackedStakingUserResponse {
//   locks: { [end: number]: GovernanceLock }
//   balance: SerializedBigNumber
//   allowance: SerializedBigNumber
//   staked: SerializedBigNumber
// }

export const fetchStakingData = createAsyncThunk(
  "assetBackedStaking/fetchStakingData",
  async ({ chainId, account }: AssetBackedStakingUserRequest): Promise<any> => {

    const assetBackedstakingContract = getAssetBackedStakingContract(chainId)
    const stakingAddress = getAssetBackedStakingAddress(chainId)

    // console.log("RED REQ CALLS inp", account, redRequiemAddress, redRequiemStakingAddress)
    // calls for general bond data
    const calls = [
      // epoch
      {
        address: stakingAddress,
        name: 'epoch',
        params: []
      },
      // conversion index
      {
        address: stakingAddress,
        name: 'index',
        params: []
      },
      // seconds to next epoch
      {
        address: stakingAddress,
        name: 'secondsToNextEpoch',
        params: []
      },
    ]

    console.log("RED REQ CALLS", calls)

    const [epoch, index, secondsToNextEpoch] =
      await multicall(chainId, abReqStaking, calls)



    return {
      epoch: {
        length: Number(epoch.length.toString()),
        number: Number(epoch.number.toString()),
        end: Number(epoch.end.toString()),
        distribute: epoch.distribute.toString()
      },
      index: index.toString(),
      secondsToNextEpoch: secondsToNextEpoch.toString()
    };
  },
);