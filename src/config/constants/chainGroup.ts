
export const chainGroup: string[] = ['BSC', 'ETH', 'MATIC', 'AVAX']

export function getGroup(chainId: number): string {
    if (chainId === 56 || chainId === 97) { return '' }
    return ''

}