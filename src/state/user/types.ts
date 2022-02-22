import { SerializedToken } from "config/constants/types";
import { SerializedWeightedPair } from "state/types";


export interface SerializedPair {
    token0: SerializedToken
    token1: SerializedToken
}

export enum FarmStakedOnly {
    ON_FINISHED = 'onFinished',
    TRUE = 'true',
    FALSE = 'false',
}

export enum ViewMode {
    TABLE = 'TABLE',
    CARD = 'CARD',
}

export interface UserProps {
    chainId: number
    account: string
    additionalTokens?: SerializedToken[]

}


export interface UserBalanceState {
    // that component is stpored separately for different chainIds
    // to simplify the management of chain switches
    balanceState: {
        [chainId: number]: {
            // we save all balance values as strings for each address
            networkCcyBalance: string

            balances: {

                [address: string]: {
                    balance: string
                    allowanceRouter: string
                    allowancePairManager: string
                }
            }


            isLoadingTokens: boolean

            isLoadingNetworkCcy: boolean
        }
    }
}

export interface UserState {

    referenceChainId: number

    // the timestamp of the last updateVersion action
    lastUpdateVersionTimestamp?: number

    userExpertMode: boolean

    // only allow swaps on direct pairs
    userSingleHopOnly: boolean

    // user defined slippage tolerance in bips, used in all txns
    userSlippageTolerance: number

    // deadline set by user in minutes, used in all txns
    userDeadline: number

    tokens: {
        [chainId: number]: {
            [address: string]: SerializedToken
        }
    }

    pairs: {
        [chainId: number]: {
            // keyed by token0Address:token1Address
            [key: string]: SerializedPair
        }
    }

    userBalances: {
        [chainId: number]: {
            // we save all balance values as strings for each address
            networkCcyBalance?: string

            balances?: {

                [address: string]: {
                    balance: string
                    allowanceRouter: string
                    allowancePairManager: string
                }
            }


            isLoadingTokens?: boolean

            isLoadingNetworkCcy?: boolean
        }
    }

    weightedPairs: {
        [chainId: number]: {
            // keyed by token0Address:token1Address
            [key: string]: SerializedWeightedPair
        }
    }

    timestamp: number
    audioPlay: boolean
    isDark: boolean
    userFarmStakedOnly: FarmStakedOnly
    gasPrice: string
    URLWarningVisible: boolean
}