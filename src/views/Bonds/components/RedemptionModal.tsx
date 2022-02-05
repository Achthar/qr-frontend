import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text, Button, Modal, LinkExternal, CalculateIcon, IconButton } from '@requiemswap/uikit'
import { ModalActions, ModalInput } from 'components/Modal'
import RoiCalculatorModal from 'components/RoiCalculatorModal'
import { useTranslation } from 'contexts/Localization'
import { getFullDisplayBalance, formatNumber } from 'utils/formatBalance'
import useToast from 'hooks/useToast'
import { getInterestBreakdown } from 'utils/compoundApyHelpers'
import { useBondFromBondId } from 'state/bonds/hooks'
import { deserializeToken } from 'state/user/hooks/helpers'
import { TokenAmount } from '@requiemswap/sdk'
import { blocksToDays, prettifySeconds, prettyVestingPeriod, secondsUntilBlock } from 'config'
import { bnParser } from 'state/bonds/calcSingleBondDetails'
import { useBlockNumber } from 'state/application/hooks'
import { useBlock } from 'state/block/hooks'

const AnnualRoiContainer = styled(Flex)`
  cursor: pointer;
`

const AnnualRoiDisplay = styled(Text)`
  width: 72px;
  max-width: 72px;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
`

interface RedemptionModalProps {
  bondId: number
  max: BigNumber
  stakedBalance: BigNumber
  multiplier?: string
  lpPrice: BigNumber
  lpLabel?: string
  onConfirm: (amount: string) => void
  onDismiss?: () => void
  tokenName?: string
  apr?: number
  displayApr?: string
  addLiquidityUrl?: string
  reqtPrice?: BigNumber
}

const RedemptionModal: React.FC<RedemptionModalProps> = ({
  bondId,
  max,
  stakedBalance,
  onConfirm,
  onDismiss,
  tokenName = '',
  multiplier,
  displayApr,
  lpPrice,
  lpLabel,
  apr,
  addLiquidityUrl,
  reqtPrice,
}) => {
  const bond = useBondFromBondId(bondId)
  const chainId = bond.token.chainId
  const [val, setVal] = useState('')
  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)
  const [showRoiCalculator, setShowRoiCalculator] = useState(false)
  const { t } = useTranslation()
  const fullBalance = useMemo(() => {
    return getFullDisplayBalance(max)
  }, [max])

  const lpTokensToStake = new BigNumber(val)
  const fullBalanceNumber = new BigNumber(fullBalance)

  const usdToStake = lpTokensToStake.times(lpPrice)

  const interestBreakdown = getInterestBreakdown({
    principalInUSD: !lpTokensToStake.isNaN() ? usdToStake.toNumber() : 0,
    apr,
    earningTokenPrice: reqtPrice.toNumber(),
  })

  const annualRoi = reqtPrice.times(interestBreakdown[3])
  const formattedAnnualRoi = formatNumber(
    annualRoi.toNumber(),
    annualRoi.gt(10000) ? 0 : 2,
    annualRoi.gt(10000) ? 0 : 2,
  )

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.validity.valid) {
        setVal(e.currentTarget.value.replace(/,/g, '.'))
      }
    },
    [setVal],
  )

  const { currentBlock } = useBlock()

  const vestingTime = () => {
    return prettyVestingPeriod(chainId, currentBlock, bond.userData.bondMaturationBlock);
  };
  console.log("VESTING", currentBlock, vestingTime(), bond.userData.bondMaturationBlock)

  const vestingPeriod = () => {
    const vestingBlock = parseInt(currentBlock.toString()) + parseInt(bond.bondTerms.vesting);
    const seconds = secondsUntilBlock(chainId, currentBlock, vestingBlock);
    return prettifySeconds(seconds, "day");
  };

  const handleSelectMax = useCallback(() => {
    setVal(fullBalance)
  }, [fullBalance, setVal])

  return (
    <Modal title={t('Redeem Bond')} onDismiss={onDismiss}>

      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Pending Rewards
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {`${(new TokenAmount(deserializeToken(bond.token), String(bond.userData.interestDue) ?? '0')).toSignificant(4)} REQ`}
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Claimable Rewards
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {`${(new TokenAmount(deserializeToken(bond.token), bond.userData.pendingPayout ?? '0')).toSignificant(4)} REQ`}
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Time until fully vested
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {vestingTime()}
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Debt Ratio
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {`${Math.round(bnParser(ethers.BigNumber.from(bond.debtRatio), ethers.BigNumber.from('1000000000')) * 10000) / 100}%`}
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Vesting Term
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {vestingPeriod()}
        </Text>
      </Flex>
      <ModalActions>
        <Button variant="secondary" onClick={onDismiss} width="100%" disabled={pendingTx}>
          {t('Cancel')}
        </Button>
        <Button
          width="100%"
          disabled={
            pendingTx || (new BigNumber(bond.userData.interestDue).eq(0) && new BigNumber(bond.userData.pendingPayout).eq(0))
          }
          onClick={async () => {
            setPendingTx(true)
            try {
              await onConfirm(val)
              toastSuccess(t('Redeemed!'), t('Your funds have been released'))
              onDismiss()
            } catch (e) {
              toastError(
                t('Error'),
                t('Please try again. Confirm the transaction and make sure you are paying enough gas!'),
              )
              console.error(e)
            } finally {
              setPendingTx(false)
            }
          }}
        >
          {pendingTx ? t('Confirming') : t('Confirm')}
        </Button>
      </ModalActions>
      <LinkExternal href={addLiquidityUrl} style={{ alignSelf: 'center' }}>
        {t('Get %symbol%', { symbol: tokenName })}
      </LinkExternal>
    </Modal>
  )
}

export default RedemptionModal
