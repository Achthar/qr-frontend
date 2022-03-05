import React from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { Flex, IconButton, useModal, CalculateIcon } from '@requiemswap/uikit'
import BondRoiCalculatorModal from 'components/RoiCalculatorModal/BondRoiCalculator'
import { useTranslation } from 'contexts/Localization'
import { useBondUser } from 'state/bonds/hooks'

const RoiLabelContainer = styled(Flex)`
  cursor: pointer;

  &:hover {
    opacity: 0.5;
  }
`

export interface BondRoiButtonProps {
  variant: 'text' | 'text-and-button'
  bondId: number
  lpSymbol: string
  lpLabel?: string
  reqtPrice?: BigNumber
  roi?: number
  displayRoi?: string
  addLiquidityUrl?: string
}

const BondRoiButton: React.FC<BondRoiButtonProps> = ({
  variant,
  bondId,
  lpLabel,
  lpSymbol,
  reqtPrice,
  roi,
  displayRoi,
  addLiquidityUrl,
}) => {
  const { t } = useTranslation()
  const lpPrice = new BigNumber(0)
  const { tokenBalance, stakedBalance } = useBondUser(bondId)
  const [onPresentRoiModal] = useModal(
    <BondRoiCalculatorModal
      linkLabel={t('Get %symbol%', { symbol: lpLabel })}
      stakingTokenBalance={stakedBalance.plus(tokenBalance)}
      stakingTokenSymbol={lpSymbol}
      stakingTokenPrice={lpPrice.toNumber()}
      earningTokenPrice={reqtPrice.toNumber()}
      roi={roi}
      displayApr={displayRoi}
      linkHref={addLiquidityUrl}
      isBond
    />,
  )

  const handleClickButton = (event): void => {
    event.stopPropagation()
    onPresentRoiModal()
  }

  return (
    <RoiLabelContainer alignItems="center" onClick={handleClickButton}>
      {displayRoi}%
      {variant === 'text-and-button' && (
        <IconButton variant="text" scale="sm" ml="4px">
          <CalculateIcon width="18px" />
        </IconButton>
      )}
    </RoiLabelContainer>
  )
}

export default BondRoiButton
