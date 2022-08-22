
export interface BaseOracleConfig {
    address: string
    token: string
    quote?: string
    decimals: number
    displayDecimals?: number
}



export interface ChainLinkOracleConfig {
    isAvailable: boolean
    oracles: {
        [address: string]:
        {
            token: string
            quote: string
            decimals?: number
        }
    }
}

export interface BandOracleConfig {
    isAvailable: boolean
    oracles: {
        [address: string]: [{
            token: string
            quote: string
            decimals?: number
        }]
    }
}






export const oracleConfig: { [chainId: number]: BaseOracleConfig[] } = {
    43113: [
        {
            address: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
            token: 'ETH',
            quote: 'USD',
            decimals: 8,
            displayDecimals: 0
        },
        {
            address: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
            token: 'AVAX',
            quote: 'USD',
            decimals: 8,
            displayDecimals: 2
        },
        {
            address: '0x31CF013A08c6Ac228C94551d535d5BAfE19c602a',
            token: 'BTC',
            quote: 'USD',
            decimals: 8,
            displayDecimals: 0
        }]
    ,
    42261: [
        {
            address: '0x61704EFB8b8120c03C210cAC5f5193BF8c80852a',
            token: 'ETH',
            quote: 'USD',
            decimals: 18,
            displayDecimals: 0
        },
        {
            address: '0x61704EFB8b8120c03C210cAC5f5193BF8c80852a',
            token: 'WBTC',
            quote: 'USD',
            decimals: 18,
            displayDecimals: 0,
        },
        {
            address: '0x61704EFB8b8120c03C210cAC5f5193BF8c80852a',
            token: 'ROSE',
            quote: 'USD',
            decimals: 18,
            displayDecimals: 5
        },
    ]

}