import React from 'react'
import styled from 'styled-components'
import RoiButton from 'views/Bonds/components/BondCard/RoiButton'
import { Address } from 'config/constants/types'
import BigNumber from 'bignumber.js'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import { Skeleton } from '@requiemswap/uikit'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useBondFromBondId } from 'state/bonds/hooks'

export interface RoiProps {
  value: string
  bondId: number
  lpLabel: string
  lpSymbol?: string
  tokenAddress?: Address
  quoteTokenAddress?: Address
  reqtPrice: BigNumber
  originalValue: number
  hideButton?: boolean
  isMobile?: boolean
}

const Container = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};

  button {
    width: 20px;
    height: 20px;

    svg {
      path {
        fill: ${({ theme }) => theme.colors.textSubtle};
      }
    }
  }
`

const RoiWrapper = styled.div`
  min-width: 60px;
  text-align: left;
`

const Roi: React.FC<RoiProps> = ({
  value,
  bondId,
  lpLabel,
  lpSymbol,
  tokenAddress,
  quoteTokenAddress,
  reqtPrice,
  originalValue,
  isMobile = false,
  hideButton = false,
}) => {
  const { chainId } = useNetworkState()
  const bond = useBondFromBondId(bondId)
  const tokenIndex = bond?.quoteTokenIndex === 0 ? 1 : 0
  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: bond?.tokens[bond.quoteTokenIndex]?.address,
    tokenAddress: bond?.tokens[tokenIndex].address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })

  const addLiquidityUrl = `${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`

  return (

    <Container>
      <RoiWrapper>{originalValue > 0 ? `${originalValue}%` : '-'}</RoiWrapper>
    </Container>
  )
}

export default Roi
