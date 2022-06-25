import { CallBond, Bond } from "state/types";

export interface ICalcBondDetailsAsyncThunk {
    bond: Bond
    chainId: number
    provider: any
}

export interface ICalcCallBondDetailsAsyncThunk {
    bond: CallBond
    chainId: number
    provider: any
}