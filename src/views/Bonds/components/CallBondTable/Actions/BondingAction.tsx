import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, useModal, IconButton, AddIcon, MinusIcon, Skeleton, Text, Heading, useTooltip, HelpIcon, Flex } from '@requiemswap/uikit'
import { useLocation } from 'react-router-dom'
import { ethers } from 'ethers'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useCallBondFromBondId, useBondUser, useCallBondUser } from 'state/bonds/hooks'
import { fetchCallBondUserDataAsync } from 'state/bonds'
import { BondWithStakedValue } from 'views/Bonds/components/types'
import { useTranslation } from 'contexts/Localization'
import { useERC20 } from 'hooks/useContract'
import { getNonQuoteToken, getQuoteToken } from 'utils/bondUtils'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import { useAppDispatch } from 'state'
import { getAddress } from 'utils/addressHelpers'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import useDepositBond from 'views/Bonds/hooks/callBond/useDepositBond'
import useApproveBond from '../../../hooks/callBond/useApproveBond'
import { ActionTitles, ActionContent } from './styles'
import CallBondingModal from '../CallBondingModal'


export const BondActionContainer = styled.div<{ isMobile: boolean }>`
  display:flex;
  flex-direction:column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  width: ${({ isMobile }) => isMobile ? '30%' : '20%'};
  border: 2px solid ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  margin-bottom: 16px;
  ${({ isMobile }) => isMobile ? 'margin-right: 5px;' : 'margin-left: 5px;'}
  ${({ theme }) => theme.mediaQueries.sm} {
    max-height: 110px;
  }

  ${({ theme }) => theme.mediaQueries.xl} {

    max-height: 110px;
  }
`
const ReferenceElement = styled.div`
  display: inline-block;
`

const IconButtonWrapper = styled.div`
  display: flex;
`

interface StackedActionProps extends BondWithStakedValue {
  isMobile: boolean
  userDataReady: boolean
  lpLabel?: string
  strike?: string
  reqPrice?: number
  otr?: boolean

}

const Bonded: React.FunctionComponent<StackedActionProps> = ({
  isMobile,
  bondId,
  apr,
  name,
  lpLabel,
  reserveAddress,
  userDataReady,
  strike,
  reqPrice,
  otr = false
}) => {
  const { t } = useTranslation()
  const { account, chainId, library } = useActiveWeb3React()
  const [requestedApproval, setRequestedApproval] = useState(false)
  const { allowance, tokenBalance, stakedBalance } = useCallBondUser(bondId)
  const bond = useCallBondFromBondId(bondId)
  const { onBonding } = useDepositBond(chainId, account, library, bond)
  const location = useLocation()

  const isApproved = account && allowance && allowance.isGreaterThan(0)

  const lpAddress = getAddress(chainId, reserveAddress)
  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: getQuoteToken(bond)?.address,
    tokenAddress: getNonQuoteToken(bond)?.address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })
  const addLiquidityUrl = `${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`
  const amountWSlippage = ethers.BigNumber.from('9000000000000000').toString()

  const handleStake = async (amount: string) => {
    await onBonding(amount, amountWSlippage)
    dispatch(fetchCallBondUserDataAsync({ chainId, account, bonds: [bond] }))
  }


  const tooltipContent = (
    <>
      <Text>
        {`Before interacting with our Bonding Contract, you have to approve spending of your ${bond.displayName} tokens.`}
      </Text>
      <Text my="24px">
        Make always sure that you understand the risk profiles of Bonding by reading our docs.
      </Text>
    </>
  )
  const { targetRef, tooltip, tooltipVisible } = useTooltip(tooltipContent, {
    placement: 'top-end',
    tooltipOffset: [20, 10],
  })

  const [onPresentBonding] = useModal(
    <CallBondingModal
      chainId={chainId}
      bondId={bondId}
      max={tokenBalance}
      lpLabel={lpLabel}
      onConfirm={handleStake}
      tokenName={name}
      addLiquidityUrl={addLiquidityUrl}
      reqPrice={reqPrice}
    />,
  )

  const lpContract = useERC20(lpAddress)
  const dispatch = useAppDispatch()
  const { onApprove } = useApproveBond(chainId, lpContract)

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      await onApprove()
      dispatch(fetchCallBondUserDataAsync({ chainId, account, bonds: [bond] }))

      setRequestedApproval(false)
    } catch (e) {
      console.error(e)
    }
  }, [onApprove, dispatch, account, bond, chainId])

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
        width={isMobile ? '45%' : otr ? '20%' : '35%'}
        onClick={onPresentBonding}
        variant="primary"
        disabled={['history', 'archived'].some((item) => location.pathname.includes(item))}
        style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', marginLeft: `${otr ? '16px' : '5px'}`, marginRight: `${otr ? '16px' : '3px'}`, borderBottomRightRadius: `${otr ? '16px' : '3px'}`, borderTopRightRadius: `${otr ? '16px' : '3px'}` }
        }
      >
        <Text fontSize='15px' color='black'>
          Purchase Bond
        </Text>
      </Button >

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
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px" textAlign='center'>
          Enable Bond
        </Text>
      </ActionTitles>
      {/* <ActionContent> */}
      <Button width="100%" disabled={requestedApproval} onClick={handleApprove} variant="secondary"
        style={{ borderRadius: '6px', width: '95%', fontSize: '13px' }}
      >
        Enable
      </Button>
      {/* </ActionContent> */}
      <Flex flexDirection='column' justifyContent='center' marginTop='5px' alignItems='center' width='100%'>
        <ReferenceElement ref={targetRef}>
          <HelpIcon color="textSubtle" />
        </ReferenceElement>
        {tooltipVisible && tooltip}
      </Flex >
    </BondActionContainer>
  )
}

export default Bonded
