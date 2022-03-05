import React, { useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { Button, Flex, Heading, IconButton, AddIcon, MinusIcon, useModal } from '@requiemswap/uikit'
import { useLocation } from 'react-router-dom'
import Balance from 'components/Balance'
import { useTranslation } from 'contexts/Localization'
import { useAppDispatch } from 'state'
import { fetchBondUserDataAsync } from 'state/bonds'
import { useBondFromBondId } from 'state/bonds/hooks'
import { getBalanceAmount, getBalanceNumber } from 'utils/formatBalance'
import useUnstakeBonds from 'views/Bonds/hooks/useUnstakeBonds'
import BondingModal from '../BondingModal'
import WithdrawModal from '../WithdrawModal'
import useStakeBonds from '../../hooks/useStakeBonds'

interface BondCardActionsProps {
  stakedBalance?: BigNumber
  tokenBalance?: BigNumber
  tokenName?: string
  bondId?: number
  multiplier?: string
  apr?: number
  displayApr?: string
  addLiquidityUrl?: string
  reqtPrice?: BigNumber
  lpLabel?: string
}

const IconButtonWrapper = styled.div`
  display: flex;
  svg {
    width: 20px;
  }
`

const StakeAction: React.FC<BondCardActionsProps> = ({
  stakedBalance,
  tokenBalance,
  tokenName,
  bondId,
  multiplier,
  apr,
  displayApr,
  addLiquidityUrl,
  reqtPrice,
  lpLabel,
}) => {
  const { t } = useTranslation()
  const { account, chainId } = useWeb3React()

  const bond = useBondFromBondId(bondId)
  const { onStake } = useStakeBonds(chainId, bond)
  const { onUnstake } = useUnstakeBonds(chainId, bond)
  const location = useLocation()
  const dispatch = useAppDispatch()


  const handleStake = async (amount: string) => {
    await onStake(amount)
    dispatch(fetchBondUserDataAsync({ chainId, account, bondIds: [bondId] }))
  }

  const handleUnstake = async (amount: string) => {
    await onUnstake(amount)
    dispatch(fetchBondUserDataAsync({ chainId, account, bondIds: [bondId] }))
  }

  const displayBalance = useCallback(() => {
    const stakedBalanceBigNumber = getBalanceAmount(stakedBalance)
    if (stakedBalanceBigNumber.gt(0) && stakedBalanceBigNumber.lt(0.0000001)) {
      return '<0.0000001'
    }
    if (stakedBalanceBigNumber.gt(0)) {
      return stakedBalanceBigNumber.toFixed(8, BigNumber.ROUND_DOWN)
    }
    return stakedBalanceBigNumber.toFixed(3, BigNumber.ROUND_DOWN)
  }, [stakedBalance])

  const [onPresentDeposit] = useModal(
    <BondingModal
      bondId={bondId}
      max={tokenBalance}
      onConfirm={handleStake}
      tokenName={tokenName}
      multiplier={multiplier}
      lpLabel={lpLabel}
      apr={apr}
      displayApr={displayApr}
      addLiquidityUrl={addLiquidityUrl}
      reqtPrice={reqtPrice}
    />,
  )
  const [onPresentWithdraw] = useModal(
    <WithdrawModal max={stakedBalance} onConfirm={handleUnstake} tokenName={tokenName} />,
  )

  const renderStakingButtons = () => {
    return stakedBalance.eq(0) ? (
      <Button
        onClick={onPresentDeposit}
        disabled={['history', 'archived'].some((item) => location.pathname.includes(item))}
      >
        {t('Stake LP')}
      </Button>
    ) : (
      <IconButtonWrapper>
        <IconButton variant="tertiary" onClick={onPresentWithdraw} mr="6px">
          <MinusIcon color="primary" width="14px" />
        </IconButton>
        <IconButton
          variant="tertiary"
          onClick={onPresentDeposit}
          disabled={['history', 'archived'].some((item) => location.pathname.includes(item))}
        >
          <AddIcon color="primary" width="14px" />
        </IconButton>
      </IconButtonWrapper>
    )
  }

  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Flex flexDirection="column" alignItems="flex-start">
        <Heading color={stakedBalance.eq(0) ? 'textDisabled' : 'text'}>{displayBalance()}</Heading>
      </Flex>
      {renderStakingButtons()}
    </Flex>
  )
}

export default StakeAction
