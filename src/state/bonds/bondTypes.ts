/** eslint no-empty-interface: 0 */
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { ChainId, JSBI, Price, TokenAmount, WeightedPair } from '@requiemswap/sdk'

import { BondConfig } from 'config/constants/types'

import { BondsState, Bond } from '../types'



export interface IBaseAsyncThunk {
    readonly chainId: ChainId;
    readonly provider: StaticJsonRpcProvider | JsonRpcProvider;
  }
  
  
  export interface IJsonRPCError {
    readonly message: string;
    readonly code: number;
  }
  
  export interface IChangeApprovalAsyncThunk extends IBaseAsyncThunk {
    readonly token: string;
    readonly address: string;
  }
  
  export interface IChangeApprovalWithDisplayNameAsyncThunk extends IChangeApprovalAsyncThunk {
    readonly displayName: string;
  }
  
  export interface IActionAsyncThunk extends IBaseAsyncThunk {
    readonly action: string;
    readonly address: string;
  }
  
  export interface IValueAsyncThunk extends IBaseAsyncThunk {
    readonly value: string;
    readonly address: string;
  }
  
  export interface IActionValueAsyncThunk extends IValueAsyncThunk {
    readonly action: string;
  }
  
  export interface IActionValueGasAsyncThunk extends IActionValueAsyncThunk {
    readonly gas: number;
  }
  
  export interface IBaseAddressAsyncThunk extends IBaseAsyncThunk {
    readonly address: string;
  }
  
  export interface IZapAsyncThunk extends IBaseAddressAsyncThunk {
    readonly tokenAddress: string;
    readonly sellAmount: number;
    readonly slippage: string;
  }
  
  // Account Slice
  
  export interface ICalcUserBondDetailsAsyncThunk extends IBaseAddressAsyncThunk, IBaseBondAsyncThunk { }
  
  // Bond Slice
  
  export interface IBaseBondAsyncThunk extends IBaseAsyncThunk {
    readonly bond: BondConfig;
  }
  
  export interface IApproveBondAsyncThunk extends IBaseBondAsyncThunk {
    readonly address: string;
  }
  
  export interface ICalcBondDetailsAsyncThunk extends IBaseBondAsyncThunk {
    readonly value: string;
  }
  
  export interface IBondAssetAsyncThunk extends IBaseBondAsyncThunk, IValueAsyncThunk {
    readonly slippage: number;
  }
  
  export interface IRedeemBondAsyncThunk extends IBaseBondAsyncThunk {
    readonly address: string;
    readonly autostake: boolean;
  }
  
  export interface IRedeemAllBondsAsyncThunk extends IBaseAsyncThunk {
    readonly bonds: Bond[];
    readonly address: string;
    readonly autostake: boolean;
  }
  
  