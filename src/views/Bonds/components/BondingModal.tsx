import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text, Button, Modal, LinkExternal, CalculateIcon, IconButton } from '@requiemswap/uikit'
import { ModalActions, ModalInput } from 'components/Modal'
import { useTranslation } from 'contexts/Localization'
import { getFullDisplayBalance, formatNumber, formatSerializedBigNumber, formatBigNumber } from 'utils/formatBalance'
import useToast from 'hooks/useToast'
import { getInterestBreakdown } from 'utils/compoundApyHelpers'
import { useBondFromBondId } from 'state/bonds/hooks'
import { fullPayoutForUsingDebtRatio, WeightedPair, TokenAmount, JSBI, payoutFor } from '@requiemswap/sdk'
import { deserializeToken } from 'state/user/hooks/helpers'
import { bnParser } from 'state/bonds/calcSingleBondDetails'
import { blocksToDays, prettifySeconds } from 'config'

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

interface BondingModalProps {
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

const BondingModal: React.FC<BondingModalProps> = (
  {
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
  }
) => {
  const bond = useBondFromBondId(bondId)
  const [val, setVal] = useState('')
  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)
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

  const token = deserializeToken(bond.token)
  const quoteToken = deserializeToken(bond.quoteToken)


  const payout = useMemo(() => {
    let returnVal = ethers.BigNumber.from(0)
    try {
      returnVal = payoutFor(
        ethers.BigNumber.from(val === '' ? 0 : new BigNumber(val).multipliedBy('1000000000000000000').toString()),
        ethers.BigNumber.from(bond.marketPrice)
      )
    }
    catch {
      returnVal = ethers.BigNumber.from(0)
    }

    return returnVal
  }, [
    val,
    bond
  ])

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.validity.valid) {
        setVal(e.currentTarget.value.replace(/,/g, '.'))
      }
    },
    [setVal],
  )


  const vesting = () => {
    return prettifySeconds(Number(bond.bondTerms?.vesting) ?? 0, 'hour');
  };


  const handleSelectMax = useCallback(() => {
    setVal(fullBalance)
  },
    [fullBalance, setVal]
  )

  const payoutNumber = Number(formatBigNumber(payout, 18, 18))
  const price = Number(formatSerializedBigNumber(bond.marketPrice, 18, 18))

  console.log("MP", bond.market.maxPayout)
  const maxPriceText = (): string => {
    let text = ''
    try {

      text = `${Math.round(Number(formatSerializedBigNumber(bond.market.maxPayout, 18, 18)) * 100) / 100}`
    }
    catch {
      text = 'no limit'
    }
    return text
  }

  return (
    <Modal title={t('Bond LP tokens')} onDismiss={onDismiss}>
      <ModalInput
        value={val}
        onSelectMax={handleSelectMax}
        onChange={handleChange}
        max={fullBalance}
        symbol={tokenName}
        addLiquidityUrl={addLiquidityUrl}
        inputTitle={t('Bond')}
      />
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          You Will Get
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {`${Math.round(payoutNumber * 1000) / 1000} REQ`}
          {price > 0 ?
            (` / ${Math.round(
              payoutNumber * price * 1000
            ) / 1000
              } USD`) : (``)}
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Discount
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {`${Math.round(bond.bondDiscount * 10000) / 100}%`}
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Maximum Payout
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {maxPriceText()}
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
          {vesting()}
        </Text>
      </Flex>
      <ModalActions>
        <Button variant="secondary" onClick={onDismiss} width="100%" disabled={pendingTx}>
          {t('Cancel')}
        </Button>
        <Button
          width="100%"
          disabled={
            pendingTx ||
            !lpTokensToStake.isFinite() ||
            lpTokensToStake.eq(0) ||
            lpTokensToStake.gt(fullBalanceNumber) ||
            payout.gt(ethers.BigNumber.from(bond.market.maxPayout))
          }
          onClick={async () => {
            setPendingTx(true)
            try {
              await onConfirm(val)
              toastSuccess(t('Bonding successful!'), t('Your LP tokens have been bonded'))
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

export default BondingModal
