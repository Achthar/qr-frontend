
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
        }
    }
}