import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { Button, Flex, Text } from '@requiemswap/uikit'
import { getAddress } from 'utils/addressHelpers'
import { useAppDispatch } from 'state'
import { fetchBondUserDataAsync } from 'state/bonds'
import { Bond } from 'state/types'
import { useTranslation } from 'contexts/Localization'
import { useERC20 } from 'hooks/useContract'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { useNetworkState } from 'state/globalNetwork/hooks'
import StakeAction from './StakeAction'
import HarvestAction from './HarvestAction'
import useApproveBond from '../../hooks/useApproveBond'


const Action = styled.div`
  padding-top: 16px;
`
export interface BondWithStakedValue extends Bond {
  apr?: number
}

interface BondCardActionsProps {
  bond: BondWithStakedValue
  account?: string
  addLiquidityUrl?: string
  reqtPrice?: BigNumber
  lpLabel?: string
}

const CardActions: React.FC<BondCardActionsProps> = ({ bond, account, addLiquidityUrl, reqtPrice, lpLabel }) => {
  const { t } = useTranslation()
  const { chainId } = useNetworkState()
  const [requestedApproval, setRequestedApproval] = useState(false)
  const { bondId, reserveAddress } = bond
  const {
    allowance: allowanceAsString = 0,
    tokenBalance: tokenBalanceAsString = 0,
    stakedBalance: stakedBalanceAsString = 0,
    earnings: earningsAsString = 0,
  } = bond.userData || {}
  const allowance = new BigNumber(allowanceAsString)
  const tokenBalance = new BigNumber(tokenBalanceAsString)
  const stakedBalance = new BigNumber(stakedBalanceAsString)
  const earnings = new BigNumber(earningsAsString)
  const lpAddress = getAddress(chainId, reserveAddress)
  const isApproved = account && allowance && allowance.isGreaterThan(0)
  const dispatch = useAppDispatch()

  const lpContract = useERC20(lpAddress)

  const { onApprove } = useApproveBond(chainId, lpContract)

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      await onApprove()
      dispatch(fetchBondUserDataAsync({ account, bondIds: [bondId] }))
      setRequestedApproval(false)
    } catch (e) {
      console.error(e)
    }
  }, [onApprove, dispatch, account, bondId])

  const renderApprovalOrStakeButton = () => {
    return isApproved ? (
      <StakeAction
        stakedBalance={stakedBalance}
        tokenBalance={tokenBalance}
        tokenName={bond.name}
        bondId={bondId}
        apr={bond.apr}
        lpLabel={lpLabel}
        reqtPrice={reqtPrice}
        addLiquidityUrl={addLiquidityUrl}
      />
    ) : (
      <Button mt="8px" width="100%" disabled={requestedApproval} onClick={handleApprove}>
        {t('Enable Contract')}
      </Button>
    )
  }

  return (
    <Action>
      <Flex>
        <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="4px">
          REQT
        </Text>
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
          {t('Earned')}
        </Text>
      </Flex>
      <HarvestAction earnings={earnings} bondId={bondId} />
      <Flex>
        <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="4px">
          {bond.name}
        </Text>
        <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
          {t('Staked')}
        </Text>
      </Flex>
      {!account ? <ConnectWalletButton mt="8px" width="100%" /> : renderApprovalOrStakeButton()}
    </Action>
  )
}

export default CardActions