import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, useModal, IconButton, AddIcon, MinusIcon, Skeleton, Text, Heading } from '@requiemswap/uikit'
import { useLocation } from 'react-router-dom'
import { BigNumber } from 'bignumber.js'
import ConnectWalletButton from 'components/ConnectWalletButton'
import Balance from 'components/Balance'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useBondFromBondId, useBondUser } from 'state/bonds/hooks'
import { fetchBondUserDataAsync } from 'state/bonds'
import { BondWithStakedValue } from 'views/Bonds/components/types'
import { useTranslation } from 'contexts/Localization'
import { useERC20 } from 'hooks/useContract'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import getChain from 'utils/getChain'
import { getNonQuoteToken, getQuoteToken } from 'utils/bondUtils'
import { ethers } from 'ethers'

import { useAppDispatch } from 'state'
import { getAddress } from 'utils/addressHelpers'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import { getBalanceAmount, getBalanceNumber, getFullDisplayBalance } from 'utils/formatBalance'

import useApproveBond from 'views/Bonds/hooks/useApproveBond'
import useRedeemBond from 'views/Bonds/hooks/useRedeemBond'
import { Note } from 'state/types'
import { ActionTitles, ActionContent } from './styles'
import RedemptionModal from '../../RedemptionModal'
import WithdrawModal from '../../WithdrawModal'

const IconButtonWrapper = styled.div`
  display: flex;
`

export const ButtonContainer = styled.div`
  padding: 16px;
  border-radius: 2px;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaQueries.sm} {
    margin-left: 12px;
    margin-right: 12px;
    margin-bottom: 0;
    max-height: 100px;
  }

  ${({ theme }) => theme.mediaQueries.xl} {
    margin-left: 48px;
    margin-right: 0;
    margin-bottom: 0;
    max-height: 100px;
  }
`


interface StackedActionProps extends BondWithStakedValue {
  userDataReady: boolean
  lpLabel?: string
  displayApr?: string
  reqPrice: BigNumber
  note: Note
}

const Redemption: React.FunctionComponent<StackedActionProps> = ({
  bondId,
  note,
  apr,
  name,
  lpLabel,
  reserveAddress,
  userDataReady,
  displayApr,
  reqPrice
}) => {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const [requestedApproval, setRequestedApproval] = useState(false)
  const { allowance, tokenBalance, stakedBalance, notes } = useBondUser(bondId)
  const noteIndex = note.noteIndex
  // const note = notes.find(n => n.noteIndex === noteIndex)
  const now = Math.floor((new Date()).getTime() / 1000);

  const bond = useBondFromBondId(bondId)

  const { onRedeem } = useRedeemBond(chainId, account, bond)
  const location = useLocation()
  const isApproved = account && allowance && allowance.isGreaterThan(0)

  const chain = getChain(chainId)
  const lpAddress = getAddress(chainId, reserveAddress)
  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: getQuoteToken(bond)?.address,
    tokenAddress: getNonQuoteToken(bond)?.address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })
  const addLiquidityUrl = `${chain}/${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`

  const handleRedemption = async () => {
    try {
      await onRedeem()
      dispatch(fetchBondUserDataAsync({ chainId, account, bonds: [bond] }))
    } catch (error) {
      console.log(error)
    }
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

  const [onPresentRedeem] = useModal(
    <RedemptionModal
      bondId={bondId}
      noteIndex={noteIndex}
      max={tokenBalance}
      lpLabel={lpLabel}
      apr={apr}
      stakedBalance={stakedBalance}
      onConfirm={handleRedemption}
      tokenName={name}
      addLiquidityUrl={addLiquidityUrl}
      reqtPrice={reqPrice}
    />,
  )

  const lpContract = useERC20(lpAddress)
  const dispatch = useAppDispatch()
  const { onApprove } = useApproveBond(chainId, lpContract, bond)

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      await onApprove()
      dispatch(fetchBondUserDataAsync({ chainId, account, bonds: [bond] }))

      setRequestedApproval(false)
    } catch (e) {
      console.error(e)
    }
  }, [onApprove, dispatch, account, bond, chainId])

  if (!account) {
    return (
      <ButtonContainer>
        <ActionContent>
          <ConnectWalletButton width="100%" />
        </ActionContent>
      </ButtonContainer>
    )
  }


  if (note && note.matured >= now) {
    return (
      <ButtonContainer>
        <ActionContent>
          <Button
            width="100%"
            onClick={handleRedemption}
            variant="secondary"
            disabled
          >
            Not matured
          </Button>
        </ActionContent>
      </ButtonContainer>
    )
  }

  if (isApproved && note) {
    if (ethers.BigNumber.from(note.payout).gt(0)) {
      return (
        <ButtonContainer>
          <ActionContent>
            {/* <div>
              <Heading>{displayBalance()}</Heading>
            </div>
            <IconButtonWrapper>
              <IconButton variant="secondary" onClick={onPresentWithdraw} mr="6px">
                <MinusIcon color="primary" width="14px" />
              </IconButton>
              <IconButton
                variant="secondary"
                onClick={onPresentRedeem}
                disabled={['history', 'archived'].some((item) => location.pathname.includes(item))}
              >
                <AddIcon color="primary" width="14px" />
              </IconButton>
            </IconButtonWrapper> */}

            <Button
              width="100%"
              onClick={handleRedemption}
              variant="secondary"
            >
              Redeem
            </Button>
          </ActionContent>
        </ButtonContainer>
      )
    }


    return (
      <ButtonContainer>
        <ActionContent>
          <Button
            width="100%"
            onClick={handleRedemption}
            variant="secondary"
            disabled
          >
            {t('Redeem')}
          </Button>
        </ActionContent>
      </ButtonContainer>
    )
  }

  if (!userDataReady) {
    return (
      <ButtonContainer>
        <ActionContent>
          <Skeleton width={180} marginBottom={28} marginTop={14} />
        </ActionContent>
      </ButtonContainer>
    )
  }

  return (
    <ButtonContainer />
  )
}

export default Redemption
