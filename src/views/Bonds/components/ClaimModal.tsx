import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text, Button, Modal, LinkExternal, CalculateIcon, IconButton } from '@requiemswap/uikit'
import { ModalActions, ModalInput } from 'components/Modal'
import { useTranslation } from 'contexts/Localization'
import { getFullDisplayBalance, formatNumber } from 'utils/formatBalance'
import useToast from 'hooks/useToast'
import { useBondFromBondId } from 'state/bonds/hooks'
import { TokenAmount } from '@requiemswap/sdk'
import { prettifySeconds} from 'config'
import { bnParser } from 'state/bonds/calcSingleBondDetails'
import { useBlock } from 'state/block/hooks'


interface ClaimModalProps {
  bondId: number
  max: BigNumber
  stakedBalance: BigNumber
  lpLabel?: string
  onConfirm: (amount: string) => void
  onDismiss?: () => void
  tokenName?: string
  apr?: number
  addLiquidityUrl?: string
  reqtPrice?: BigNumber
}

const ClaimModal: React.FC<ClaimModalProps> = ({
  bondId,
  max,
  stakedBalance,
  onConfirm,
  onDismiss,
  tokenName = '',
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
  const { t } = useTranslation()
  const fullBalance = useMemo(() => {
    return getFullDisplayBalance(max)
  }, [max])

  const lpTokensToStake = new BigNumber(val)


  const { currentBlock } = useBlock()
  const now = Math.round((new Date()).getTime() / 1000);

  const vestingPeriod = () => {
    const vestingTerm = parseInt(bond.bondTerms.vesting);
    // const seconds = secondsUntilBlock(chainId, currentBlock, vestingBlock);
    return prettifySeconds(vestingTerm, "");
  };

  const handleSelectMax = useCallback(() => {
    setVal(fullBalance)
  }, [fullBalance, setVal])

  return (
    <Modal title={t('Redeem Bond')} onDismiss={onDismiss}>


      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Claimable Rewards
        </Text>
      </Flex>
      <Flex mt="24px" alignItems="center" justifyContent="space-between">
        <Text mr="8px" color="textSubtle">
          Debt Ratio
        </Text>
        <Text mr="8px" color="textSubtle" textAlign='center'>
          {`${Math.round(bnParser(ethers.BigNumber.from(bond.debtRatio), ethers.BigNumber.from('1000000000000000000')) * 10000) / 100}%`}
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

export default ClaimModal