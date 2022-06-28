import React from 'react'
import styled from 'styled-components'
import ApyButton from 'views/Bonds/components/BondCard/ApyButton'
import { Address } from 'config/constants/types'
import BigNumber from 'bignumber.js'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import { Skeleton } from '@requiemswap/uikit'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useBondFromBondId } from 'state/bonds/hooks'
import getChain from 'utils/getChain'
import { getNonQuoteToken, getQuoteToken } from 'utils/bondUtils'

export interface AprProps {
  value: string
  multiplier?: string
  bondId: number
  lpLabel: string
  lpSymbol?: string
  tokenAddress?: Address
  quoteTokenAddress?: Address
  reqtPrice: BigNumber
  originalValue: number
  hideButton?: boolean
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

const AprWrapper = styled.div`
  min-width: 60px;
  text-align: left;
`

const Apr: React.FC<AprProps> = ({
  value,
  bondId,
  lpLabel,
  lpSymbol,
  multiplier,
  tokenAddress,
  quoteTokenAddress,
  reqtPrice,
  originalValue,
  hideButton = false,
}) => {
  const { chainId } = useNetworkState()
  const bond = useBondFromBondId(bondId)
  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: getQuoteToken(bond)?.address,
    tokenAddress: getNonQuoteToken(bond)?.address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })

  const chain = getChain(chainId)

  const addLiquidityUrl = `${chain}/${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`

  return originalValue !== 0 ? (
    <Container>
      {originalValue ? (
        <ApyButton
          variant={hideButton ? 'text' : 'text-and-button'}
          bondId={bondId}
          lpSymbol={lpSymbol}
          lpLabel={lpLabel}
          multiplier={multiplier}
          reqtPrice={reqtPrice}
          apr={originalValue}
          displayApr={value}
          addLiquidityUrl={addLiquidityUrl}
        />
      ) : (
        <AprWrapper>
          <Skeleton width={60} />
        </AprWrapper>
      )}
    </Container>
  ) : (
    <Container>
      <AprWrapper>{originalValue}%</AprWrapper>
    </Container>
  )
}

export default Apr
