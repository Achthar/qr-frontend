
export interface OracleConfig {
    token: string
    quote: string
    decimals?: number
}

export const oracleConfig = {
    43113: {
        '0x86d67c3D38D2bCeE722E601025C25a575021c6EA': {
            token: 'ETH',
            quote: 'USD',
            decimals: 8
        },
        '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD': {
            token: 'AVAX',
            quote: 'USD',
            decimals: 8
        },
        '0x31CF013A08c6Ac228C94551d535d5BAfE19c602a': {
            token: 'BTC',
            quote: 'USD',
            decimals: 8
        }
    }
}