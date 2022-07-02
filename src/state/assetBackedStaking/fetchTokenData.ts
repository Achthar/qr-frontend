/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { ethers, BigNumber } from 'ethers'
import multicall from 'utils/multicall';
import abReqStaking from 'config/abi/avax/sRequiem.json'
import { getAssetBackedStakingAddress, getGovernanceRequiemAddress, getRedRequiemAddress, getRedRequiemStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';
import { getAssetBackedStakingContract } from 'utils/contractHelpers';
import { ABREQ, GREQ, SREQ } from 'config/constants/tokens';
import { Indexed } from 'ethers/lib/utils';
import { ONE_18 } from '@requiemswap/sdk';


const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')


export interface AssetBackedStakingRequest {
  chainId: number
  // account: string
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

export const fetchTokenData = createAsyncThunk(
  "assetBackedStaking/fetchTokenData",
  async ({ chainId }: AssetBackedStakingRequest): Promise<any> => {

    const sREQAddress = SREQ[chainId].address
    const gREQAddress = GREQ[chainId].address
    const abREQAddress = ABREQ[chainId].address
    const stakingAddress = getAssetBackedStakingAddress(chainId)

    // console.log("RED REQ CALLS inp", account, redRequiemAddress, redRequiemStakingAddress)
    // calls for general bond data
    const calls = [
      // epoch
      {
        address: sREQAddress,
        name: 'INDEX',
        params: []
      },
      // conversion index
      {
        address: sREQAddress,
        name: 'totalSupply',
        params: []
      },
      // seconds to next epoch
      {
        address: sREQAddress,
        name: 'balanceOf',
        params: [stakingAddress]
      },
      {
        address: gREQAddress,
        name: 'balanceOf',
        params: [stakingAddress]
      },
      // {
      //   address: sREQAddress,
      //   name: 'TOTAL_GONS',
      //   params: []
      // },
      // conversion index
      {
        address: gREQAddress,
        name: 'totalSupply',
        params: []
      },
      {
        address: abREQAddress,
        name: 'totalSupply',
        params: []
      },

    ]
    const totalGons = ethers.constants.MaxUint256.sub(ethers.constants.MaxUint256.mod(BigNumber.from('5000000').mul(ONE_18)))
    const [INDEX, supply, balanceS, balanceG, supplyGREQ, supplyABREQ] =
      await multicall(chainId, abReqStaking, calls)

    return {
      INDEX: INDEX[0].toString(),
      totalSupplySReq: supply[0].toString(),
      totalSupplyGReq: supplyGREQ[0].toString(),
      totalSupplyAbReq: supplyABREQ[0].toString(),
      stakingBalanceGreq: balanceG[0].toString(),
      stakingBalanceSreq: balanceS[0].toString(),
      gonsPerFragment: totalGons.div(supply[0]).toString()
    };
  },
);