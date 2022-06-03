import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, useModal, IconButton, AddIcon, MinusIcon, Skeleton, Text, Heading } from '@requiemswap/uikit'
import { useLocation } from 'react-router-dom'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import ConnectWalletButton from 'components/ConnectWalletButton'
import Balance from 'components/Balance'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useBondFromBondId, useBondUser } from 'state/bonds/hooks'
import { fetchBondUserDataAsync } from 'state/bonds'
import { BondWithStakedValue } from 'views/Bonds/components/types'
import { useTranslation } from 'contexts/Localization'
import { useERC20 } from 'hooks/useContract'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import { useAppDispatch } from 'state'
import { getAddress } from 'utils/addressHelpers'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import { getBalanceAmount, getBalanceNumber, getFullDisplayBalance } from 'utils/formatBalance'
import useDepositBond from 'views/Bonds/hooks/useDepositBond'
import BondingModal from '../../BondingModal'
import WithdrawModal from '../../WithdrawModal'
import useApproveBond from '../../../hooks/useApproveBond'
import { BondActionContainer, ActionTitles, ActionContent } from './styles'

const IconButtonWrapper = styled.div`
  display: flex;
`

interface StackedActionProps extends BondWithStakedValue {
  isMobile: boolean
  userDataReady: boolean
  lpLabel?: string
  displayApr?: string
}

const Bonded: React.FunctionComponent<StackedActionProps> = ({
  isMobile,
  bondId,
  apr,
  name,
  lpLabel,
  reserveAddress,
  userDataReady,
  displayApr,
}) => {
  const { t } = useTranslation()
  const { account, chainId, library } = useActiveWeb3React()
  const [requestedApproval, setRequestedApproval] = useState(false)
  const { allowance, tokenBalance, stakedBalance } = useBondUser(bondId)
  const bond = useBondFromBondId(bondId)
  const { onBonding } = useDepositBond(chainId, account, library, bond)
  const location = useLocation()

  console.log("ALLOWANCE", allowance.toString(), tokenBalance, bondId, bond)
  const isApproved = account && allowance && allowance.isGreaterThan(0)

  const lpAddress = getAddress(chainId, reserveAddress)
  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: bond?.quoteToken?.address,
    tokenAddress: bond?.token?.address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })
  const addLiquidityUrl = `${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`
  const amountWSlippage = ethers.BigNumber.from('9000000000000000').toString()

  const handleStake = async (amount: string) => {
    await onBonding(amount, amountWSlippage)
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

  const [onPresentBonding] = useModal(
    <BondingModal
      bondId={bondId}
      max={tokenBalance}
      lpLabel={lpLabel}
      onConfirm={handleStake}
      tokenName={name}
      addLiquidityUrl={addLiquidityUrl}
    />,
  )

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
      <BondActionContainer isMobile={isMobile}>
        <ActionTitles>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
            {t('Start Bonding')}
          </Text>
        </ActionTitles>
        <ActionContent>
          <ConnectWalletButton width="100%" />
        </ActionContent>
      </BondActionContainer>
    )
  }

  if (isApproved) {

    return (
      <Button
        // marginBottom="-30px"
        width={isMobile ? '45%' : '35%'}
        onClick={onPresentBonding}
        variant="primary"
        disabled={['history', 'archived'].some((item) => location.pathname.includes(item))}
        style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', marginLeft: '5px', marginRight: '3px', borderBottomRightRadius: '3px', borderTopRightRadius: '3px' }}

      >
        <Text fontSize='15px' color='black'>
          Purchase Bond
        </Text>
      </Button>

    )
  }

  if (!userDataReady) {
    return (
      <BondActionContainer isMobile={isMobile}>
        <ActionTitles>
          <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
            {t('Start Bonding')}
          </Text>
        </ActionTitles>
        <ActionContent>
          <Skeleton width={180} marginBottom={28} marginTop={14} />
        </ActionContent>
      </BondActionContainer>
    )
  }

  return (
    <BondActionContainer isMobile={isMobile}>
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
    </BondActionContainer>
  )
}

export default Bonded
