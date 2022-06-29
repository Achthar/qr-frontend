import React from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { Flex, IconButton, useModal, CalculateIcon, Text } from '@requiemswap/uikit'
import BondRoiCalculatorModal from 'components/RoiCalculatorModal/BondRoiCalculator'
import { useTranslation } from 'contexts/Localization'
import { useBondUser } from 'state/bonds/hooks'

const RoiLabelContainer = styled(Flex)`
  cursor: pointer;

  &:hover {
    opacity: 0.5;
  }
`

export interface RoiButtonProps {
  variant: 'text' | 'text-and-button'
  bondId: number
  lpSymbol: string
  lpLabel?: string
  reqtPrice?: BigNumber
  roi?: number
  displayRoi?: string
  addLiquidityUrl?: string
  isMobile?: boolean
}

const RoiButton: React.FC<RoiButtonProps> = ({
  variant,
  bondId,
  lpLabel,
  lpSymbol,
  reqtPrice,
  roi,
  displayRoi,
  addLiquidityUrl,
  isMobile = false
}) => {
  const { t } = useTranslation()
  const lpPrice = new BigNumber(1) // useLpTokenPrice(lpSymbol)
  const { tokenBalance, stakedBalance } = useBondUser(bondId)

  return (
    <RoiLabelContainer alignItems="center" onClick={() => { return null }}>
      <Text fontSize={isMobile ? '13px' : '15px'}>
        {Number(displayRoi) > 0 ? `${displayRoi}%` : '-'}
      </Text>
      {variant === 'text-and-button' && (
        <IconButton variant="text" scale="sm" ml="4px">
          <CalculateIcon width="18px" />
        </IconButton>
      )}
    </RoiLabelContainer >
  )
}

export default RoiButton
