import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { Button, useModal, IconButton, AddIcon, MinusIcon, Skeleton, Text, Heading } from '@requiemswap/uikit'

import ConnectWalletButton from 'components/ConnectWalletButton'
import Balance from 'components/Balance'
import useActiveWeb3React from 'hooks/useActiveWeb3React'


import useRedeemCallableNote, { useRedeemCallableNotes } from 'views/Bonds/hooks/callableBond/useRedeemBond'
import { CallableNote } from 'state/types'
import { ActionContent } from './styles'

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


interface StackedActionProps {
  userDataReady: boolean
  notes: CallableNote[]
}

const GeneralRedemptionMulti: React.FunctionComponent<StackedActionProps> = ({
  notes,
  userDataReady,
}) => {

  const { account, chainId } = useActiveWeb3React()

  const now = Math.floor((new Date()).getTime() / 1000);

  const finalNotes = notes.filter(no => no.matured <= now).map(x => x.noteIndex)

  const { onRedeem } = useRedeemCallableNotes(chainId, account, finalNotes)


  const handleRedemption = async () => {
    try {
      await onRedeem()
    } catch (error) {
      console.log(error)
    }
  }



  if (!account) {
    return (
      <ButtonContainer>
        <ActionContent>
          <ConnectWalletButton width="100%" />
        </ActionContent>
      </ButtonContainer>
    )
  }


  if (finalNotes && finalNotes.length === 0) {
    return (
      <ButtonContainer>
        <ActionContent>
          <Button
            width="100%"
            onClick={handleRedemption}
            variant="secondary"
            disabled
          >
            None matured
          </Button>
        </ActionContent>
      </ButtonContainer>
    )
  }

  if (finalNotes && finalNotes.length > 0) {
    return (
      <ButtonContainer>
        <ActionContent>
          <Button
            width="100%"
            onClick={handleRedemption}
            variant="secondary"
          >
            Redeem matured
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

export default GeneralRedemptionMulti
