import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text, Button, Modal, LinkExternal, CalculateIcon, IconButton } from '@requiemswap/uikit'
import { ModalActions, ModalInput } from 'components/Modal'
import { useTranslation } from 'contexts/Localization'
import { getFullDisplayBalance, formatNumber } from 'utils/formatBalance'
import useToast from 'hooks/useToast'
import { getInterestBreakdown } from 'utils/compoundApyHelpers'
import { useBondFromBondId } from 'state/bonds/hooks'
import { fullPayoutForUsingDebtRatio, WeightedPair, TokenAmount, JSBI } from '@requiemswap/sdk'
import { deserializeToken } from 'state/user/hooks/helpers'
import { bnParser } from 'state/bonds/calcSingleBondDetails'
import { blocksToDays } from 'config'

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

  const pair = useMemo(() => {
    return new WeightedPair(
      new TokenAmount(
        token,
        token.sortsBefore(quoteToken) ? bond.lpData.reserve0 : bond.lpData.reserve1
      ),
      new TokenAmount(
        quoteToken,
        token.sortsBefore(quoteToken) ? bond.lpData.reserve1 : bond.lpData.reserve0
      ),
      JSBI.BigInt(80),
      JSBI.BigInt(25)
    )
  },
    [token, quoteToken, bond.lpData.reserve0, bond.lpData.reserve1])


  const payout = useMemo(() => {
    const bondTerms = {
      controlVariable: ethers.BigNumber.from(bond.bondTerms.controlVariable), // scaling variable for price
      vesting: ethers.BigNumber.from(bond.bondTerms.vesting), // in blocks
      maxPayout: ethers.BigNumber.from(bond.market.maxPayout), // in thousandths of a %. i.e. 500 = 0.5%
      maxDebt: ethers.BigNumber.from(bond.bondTerms.maxDebt)
    }

    let returnVal = ethers.BigNumber.from(0)
    try {
      returnVal = fullPayoutForUsingDebtRatio(
        pair,
        ethers.BigNumber.from(bond.debtRatio),
        ethers.BigNumber.from(bond.lpData.lpTotalSupply),
        ethers.BigNumber.from(val === '' ? 0 : val),
        deserializeToken(bond.token),
        bondTerms
      )
    }
    catch {
      returnVal = ethers.BigNumber.from(0)
    }

    return returnVal
  }, [
    val,
    pair,
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

  const handleSelectMax = useCallback(() => {
    setVal(fullBalance)
  },
    [fullBalance, setVal]
  )

  const payoutNumber = bnParser(payout, ethers.BigNumber.from('1000000000000000000'))
  const price = bnParser(ethers.BigNumber.from(bond.marketPrice), ethers.BigNumber.from('1000000000000000000'))

  const maxPriceText = (): string => {
    let text = ''
    try {
      text = `${Math.round(bnParser(ethers.BigNumber.from(bond.maxBondPrice), ethers.BigNumber.from('1000000000000000000')) * 100) / 100}`
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
          ROI
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {`${Math.round(bond.bondDiscount * 10000) / 100}%`}
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Max You Can Buy
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
          {`${Math.round(blocksToDays(Number(bond.bondTerms.vesting), bond.token.chainId) * 100) / 100} days`}
        </Text>
      </Flex>
      <ModalActions>
        <Button variant="secondary" onClick={onDismiss} width="100%" disabled={pendingTx}>
          {t('Cancel')}
        </Button>
        <Button
          width="100%"
          disabled={
            pendingTx || !lpTokensToStake.isFinite() || lpTokensToStake.eq(0) || lpTokensToStake.gt(fullBalanceNumber)
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
