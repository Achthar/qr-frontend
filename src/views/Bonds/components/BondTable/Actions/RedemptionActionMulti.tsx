import React from 'react'
import styled from 'styled-components'

import { Button, Skeleton, Text } from '@requiemswap/uikit'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { fetchBondUserDataAsync } from 'state/bonds'
import { useAppDispatch } from 'state'
import { useRedeemNotes } from 'views/Bonds/hooks/useRedeemBond'
import { ActionContent } from './styles'




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


interface RedeemMultiProps {
  userDataReady: boolean
  indexes: number[]
  bondIds: number[]
  sendGREQ: boolean
  isMobile: boolean
}

const RedemptionMulti: React.FunctionComponent<RedeemMultiProps> = ({
  indexes,
  bondIds,
  sendGREQ,
  userDataReady,
  isMobile
}) => {
  const { account, chainId } = useActiveWeb3React()


  console.log("REDEEM", indexes, bondIds)
  const { onRedeem } = useRedeemNotes(chainId, account, indexes, sendGREQ)

  const handleRedemption = async () => {
    try {
      await onRedeem()
      dispatch(fetchBondUserDataAsync({ chainId, account, bondIds }))
    } catch (error) {
      console.log(error)
    }
  }


  const dispatch = useAppDispatch()

  if (!account) {
    return (<div />
    )
  }


  if (indexes.length === 0) {
    return (
        <Button
          width={isMobile ? '45%' : "40%"}
          onClick={handleRedemption}
          variant="secondary"
          disabled
          style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '5px', marginRight: '3px', borderBottomRightRadius: '16px', borderTopRightRadius: '16px' }}
        >
          <Text fontSize='15px' >
            None Matured
          </Text>
        </Button>
    )
  }





  if (!userDataReady) {
    return (
      <ActionContent>
        <Skeleton width={180} marginBottom={28} marginTop={14} />
      </ActionContent>
    )
  }

  return (
    <ActionContent>
      <Button
        width="50%"
        onClick={handleRedemption}
        variant="primary"
        style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '5px', marginRight: '3px', borderBottomRightRadius: '16px', borderTopRightRadius: '16px' }}
      >
        <Text fontSize='15px' color='black'>
          Redeem Matured
        </Text>
      </Button>
    </ActionContent>
  )
}

export default RedemptionMulti
