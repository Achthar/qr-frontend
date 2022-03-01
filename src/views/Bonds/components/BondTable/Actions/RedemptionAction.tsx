import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, useModal, IconButton, AddIcon, MinusIcon, Skeleton, Text, Heading } from '@requiemswap/uikit'
import { useLocation } from 'react-router-dom'
import { BigNumber } from 'bignumber.js'
import ConnectWalletButton from 'components/ConnectWalletButton'
import Balance from 'components/Balance'
import { useWeb3React } from '@web3-react/core'
import { useBondFromBondId, useBondUser, useLpTokenPrice, usePriceReqtUsd } from 'state/bonds/hooks'
import { fetchBondUserDataAsync } from 'state/bonds'
import { BondWithStakedValue } from 'views/Bonds/components/BondCard/BondCard'
import { useTranslation } from 'contexts/Localization'
import { useERC20 } from 'hooks/useContract'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import getChain from 'utils/getChain'
import { useAppDispatch } from 'state'
import { getAddress } from 'utils/addressHelpers'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import { getBalanceAmount, getBalanceNumber, getFullDisplayBalance } from 'utils/formatBalance'
import useUnstakeBonds from 'views/Bonds/hooks/useUnstakeBonds'
import useStakeBonds from 'views/Bonds/hooks/useStakeBonds'
import useApproveBond from 'views/Bonds/hooks/useApproveBond'
import useRedeemBond from 'views/Bonds/hooks/useRedeemBond'
import { ActionContainer, ActionTitles, ActionContent } from './styles'
import RedemptionModal from '../../RedemptionModal'
import WithdrawModal from '../../WithdrawModal'

const IconButtonWrapper = styled.div`
  display: flex;
`

interface StackedActionProps extends BondWithStakedValue {
  userDataReady: boolean
  lpLabel?: string
  displayApr?: string
}

const Redemption: React.FunctionComponent<StackedActionProps> = ({
  bondId,
  apr,
  name,
  lpLabel,
  reserveAddress,
  userDataReady,
  displayApr,
}) => {
  const { t } = useTranslation()
  const { account, chainId } = useWeb3React()
  const [requestedApproval, setRequestedApproval] = useState(false)
  const { allowance, tokenBalance, stakedBalance } = useBondUser(bondId)

  const bond = useBondFromBondId(bondId)

  const { onUnstake } = useUnstakeBonds(chainId, bond)
  const { onRedeem } = useRedeemBond(chainId, account, bond)
  const location = useLocation()
  const lpPrice = useLpTokenPrice(name)
  const reqtPrice = usePriceReqtUsd(chainId ?? 43113)
  const isApproved = account && allowance && allowance.isGreaterThan(0)

  const chain = getChain(chainId)
  const lpAddress = getAddress(chainId, reserveAddress)
  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: bond?.quoteToken?.address,
    tokenAddress: bond?.token?.address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })
  const addLiquidityUrl = `${chain}/${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`

  const handleRedemption = async (amount: string) => {
    await onRedeem()
    dispatch(fetchBondUserDataAsync({ chainId, account, bondIds: [bondId] }))
  }

  const handleUnstake = async (amount: string) => {
    await onUnstake(amount)
    dispatch(fetchBondUserDataAsync({ chainId, account, bondIds: [bondId] }))
  }

  const displayBalance = useCallback(() => {
    const stakedBalanceBigNumber = getBalanceAmount(stakedBalance)
    if (stakedBalanceBigNumber.gt(0) && stakedBalanceBigNumber.lt(0.0000001)) {
      return stakedBalanceBigNumber.toFixed(10, BigNumber.ROUND_DOWN)
    }
    if (stakedBalanceBigNumber.gt(0) && stakedBalanceBigNumber.lt(0.0001)) {
      return getFullDisplayBalance(stakedBalance).toLocaleString()
    }
    return stakedBalanceBigNumber.toFixed(3, BigNumber.ROUND_DOWN)
  }, [stakedBalance])

  const [onPresentDeposit] = useModal(
    <RedemptionModal
      bondId={bondId}
      max={tokenBalance}
      lpPrice={lpPrice}
      lpLabel={lpLabel}
      apr={apr}
      stakedBalance={stakedBalance}
      onConfirm={handleRedemption}
      tokenName={name}
      addLiquidityUrl={addLiquidityUrl}
      reqtPrice={reqtPrice}
    />,
  )
  const [onPresentWithdraw] = useModal(
    <WithdrawModal max={stakedBalance} onConfirm={handleUnstake} tokenName={name} />,
  )
  console.log("IS APPROVED", isApproved)
  const lpContract = useERC20(lpAddress)
  const dispatch = useAppDispatch()
  const { onApprove } = useApproveBond(chainId, lpContract, bond)

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      await onApprove()
      dispatch(fetchBondUserDataAsync({ chainId, account, bondIds: [bondId] }))

      setRequestedApproval(false)
    } catch (e) {
      console.error(e)
    }
  }, [onApprove, dispatch, account, bondId, chainId])

  if (!account) {
    return (
      <ActionContainer>
        <ActionTitles>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
            {t('Redeem Bond / claim Rewards ')}
          </Text>
        </ActionTitles>
        <ActionContent>
          <ConnectWalletButton width="100%" />
        </ActionContent>
      </ActionContainer>
    )
  }

  if (isApproved) {
    if (stakedBalance.gt(0)) {
      return (
        <ActionContainer>
          <ActionTitles>
            <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="4px">
              {name}
            </Text>
            <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
              {t('Redemption')}
            </Text>
          </ActionTitles>
          <ActionContent>
            <div>
              <Heading>{displayBalance()}</Heading>
              {stakedBalance.gt(0) && lpPrice.gt(0) && (
                <Balance
                  fontSize="12px"
                  color="textSubtle"
                  decimals={2}
                  value={getBalanceNumber(lpPrice.times(stakedBalance))}
                  unit=" USD"
                  prefix="~"
                />
              )}
            </div>
            <IconButtonWrapper>
              <IconButton variant="secondary" onClick={onPresentWithdraw} mr="6px">
                <MinusIcon color="primary" width="14px" />
              </IconButton>
              <IconButton
                variant="secondary"
                onClick={onPresentDeposit}
                disabled={['history', 'archived'].some((item) => location.pathname.includes(item))}
              >
                <AddIcon color="primary" width="14px" />
              </IconButton>
            </IconButtonWrapper>
          </ActionContent>
        </ActionContainer>
      )
    }

    return (
      <ActionContainer>
        <ActionTitles>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px" pr="4px">
            {t('Redeem').toUpperCase()}
          </Text>
          <Text bold textTransform="uppercase" color="secondary" fontSize="12px">
            {name}
          </Text>
        </ActionTitles>
        <ActionContent>
          <Button
            width="100%"
            onClick={onPresentDeposit}
            variant="secondary"
            disabled={['history', 'archived'].some((item) => location.pathname.includes(item))}
          >
            {t('Redeem Bond')}
          </Button>
        </ActionContent>
      </ActionContainer>
    )
  }

  if (!userDataReady) {
    return (
      <ActionContainer>
        <ActionTitles>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
            {t('Start Bonding')}
          </Text>
        </ActionTitles>
        <ActionContent>
          <Skeleton width={180} marginBottom={28} marginTop={14} />
        </ActionContent>
      </ActionContainer>
    )
  }

  return (
    <ActionContainer>
      <ActionTitles>
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
          {t('Enable Bond')}
        </Text>
      </ActionTitles>
      <ActionContent>
        <Button width="100%" disabled={requestedApproval} onClick={handleApprove} variant="secondary">
          {t('Enable')}
        </Button>
      </ActionContent>
    </ActionContainer>
  )
}

export default Redemption
