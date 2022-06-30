import React, { useMemo, useState } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import { LinkExternal, Text, useMatchBreakpoints } from '@requiemswap/uikit'
import useActiveWeb3React from "hooks/useActiveWeb3React";
import { getAddress } from 'utils/addressHelpers'
import { getNetworkExplorerLink } from 'utils'
import { ethers } from 'ethers';

import { CallableBondWithStakedValue } from 'views/Bonds/components/types'
import BondingAction from './BondingAction'
import RedemptionMulti from './RedemptionActionMulti'
import Roi, { RoiProps } from '../Roi'
import CallNoteRow, { CallableNoteHeaderRow } from '../CallableNoteRow'
import { PreviewPanel } from './PreviewPanel'


export interface CallableActionPanelProps {
  strike: string
  details: CallableBondWithStakedValue
  userDataReady: boolean
  expanded: boolean
  reqPrice: number
  price: {
    reqPrice: number
    price: number
  }
}

const expandAnimation = keyframes`
  from {
    max-height: 0px;
  }
  to {
    max-height: 500px;
  }
`

const collapseAnimation = keyframes`
  from {
    max-height: 500px;
  }
  to {
    max-height: 0px;
  }
`

const Container = styled.div<{ expanded, isMobile: boolean }>`
  box-sizing: ${({ isMobile }) => isMobile ? 'border-box' : 'content-box'};
  animation: ${({ expanded }) =>
    expanded
      ? css`
          ${expandAnimation} 300ms linear forwards
        `
      : css`
          ${collapseAnimation} 300ms linear forwards
        `};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  width: 100%;
  flex-direction: column-reverse;
   ${({ isMobile }) => isMobile ? 'padding: 2px;' : 'padding: 24px;'}

  ${({ theme }) => theme.mediaQueries.lg} {
    flex-direction: row;
    padding: 16px 32px;
  }
`

const StyledLinkExternal = styled(LinkExternal)`
align-self:flex-start;
  font-weight: 400;
`

const StakeContainer = styled.div<{ isMobile: boolean }>`
  color: ${({ theme }) => theme.colors.text};
  align-items: ${({ isMobile }) => isMobile ? 'space-between' : 'center'};
  flex-direction: ${({ isMobile }) => isMobile ? 'row' : 'column'};
  width: ${({ isMobile }) => isMobile ? '10s0%' : '100%'};
  display: flex;
  justify-content: ${({ isMobile }) => isMobile ? 'space-between' : 'center'};

  ${({ theme }) => theme.mediaQueries.sm} {
    justify-content: flex-start;
  }
`

const TagsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 15px;
  margin-left: 20px;

  ${({ theme }) => theme.mediaQueries.sm} {
    margin-top: 16px;
  }

  > div {
    height: 24px;
    padding: 0 6px;
    font-size: 14px;
    margin-right: 4px;

    svg {
      width: 14px;
    }
  }
`

const NoteContainer = styled.div<{ isMobile: boolean }>`
  margin-top:0px;
  width:100%;
  align-self: center;
  display: flex;
  flex-direction: column;
  padding: 2px;
  ${({ isMobile }) => isMobile ? `
  overflow-y: auto;
  ::-webkit-scrollbar {
    width: 12px;
  }` : `max-height: 500px;
  overflow-y: auto;
  ::-webkit-scrollbar {
    width: 12px;
  }` }
`

const GeneralActionContainer = styled.div`
  display: flex;
  fle-wrap: nowrap;
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-top:10px;
  margin-bottom: 5px;
`

const GeneralActionContainerMobile = styled.div`
  display: flex;
  fle-wrap: nowrap;
  flex-direction: row;
  width: 100%;
  margin-top:10px;
  justify-content: center;
  align-items:center;
  margin-bottom: 5px;
`

const ActionContainerNoBond = styled.div`
  align-items: center;
  display: flex;
  fle-wrap: nowrap;
  flex-direction: row;
  width: 100%;
  height:100%;
  margin-top:2px;
`


const ActionContainerNoBondButton = styled.div`
  width: 50%;
  margin-left:20%;
`


const InfoContainer = styled.div`
  min-width: 200px;
  flex-direction: column;
`


const ValueContainer = styled.div`
  display: block;
  flex-direction: column;

  ${({ theme }) => theme.mediaQueries.lg} {
    display: none;
  }
`

const ValueWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0px;
`

const Line = styled.hr`
  z-index:5;
  margin-top: 3px;
  margin-bottom: 3px;
  color: ${({ theme }) => theme.colors.backgroundAlt};
  width: 100%;
  size: 0.2;
`;

const ActionPanel: React.FunctionComponent<CallableActionPanelProps> = ({
  details,
  strike,
  userDataReady,
  expanded,
  price
}) => {
  const bond = details

  const { isMobile } = useMatchBreakpoints()
  const { chainId, account } = useActiveWeb3React()
  const { t } = useTranslation()

  const lpLabel = 'Bond'

  const lpAddress = getAddress(chainId, bond.reserveAddress)
  const explorer = getNetworkExplorerLink(lpAddress, 'address')

  const now = Math.floor((new Date()).getTime() / 1000);

  const isApproved = useMemo(() => {
    if (!bond.userData) return false
    return ethers.BigNumber.from(bond.userData.allowance).gt(0)
  },
    [bond.userData]
  )
  return (
    <Container expanded={expanded} isMobile={isMobile}>
      <InfoContainer>
        <StakeContainer isMobile={isMobile}>
          <StyledLinkExternal href={bond.lpLink}>
            Get LP for Bond
          </StyledLinkExternal>
          <StyledLinkExternal href={explorer}>{t('View Contract')}</StyledLinkExternal>
        </StakeContainer>
        {!isMobile && userDataReady && details?.userData?.notes && (
          <GeneralActionContainer>
            {isApproved && (<BondingAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} isMobile={isMobile} reqPrice={price.reqPrice} />)}
            <RedemptionMulti
              isMobile={false}
              thisBond={bond}
              bondIds={[bond.bondId]}
              userDataReady={userDataReady}
              indexes={bond?.userData?.notes.filter(y => y.matured <= now).map(x => x.noteIndex) ?? []}
              reqPrice={price.reqPrice}
              chainId={chainId}
              account={account}
              hasPosition={details?.userData?.notes.length > 0}
            />
          </GeneralActionContainer>
        )}
        {
          isMobile && (
            <GeneralActionContainerMobile>
              {account ? (
                <>
                  <BondingAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} isMobile={isMobile} reqPrice={price.reqPrice} />
                  <RedemptionMulti
                    isMobile={isMobile}
                    bondIds={[bond.bondId]}
                    thisBond={bond}
                    userDataReady={userDataReady}
                    indexes={bond?.userData?.notes.filter(y => y.matured <= now).map(x => x.noteIndex) ?? []}
                    reqPrice={price.reqPrice}
                    chainId={chainId}
                    account={account}
                    hasPosition={details?.userData?.notes.length > 0}
                  />
                </>
              ) : <PreviewPanel
                isMobile={isMobile}
                thisBond={bond}
                reqPrice={price.reqPrice}
                chainId={chainId}
                account={account}
              />}
            </GeneralActionContainerMobile>
          )
        }
      </InfoContainer>

      <NoteContainer isMobile={isMobile}>
        {details?.userData?.notes.length > 0 && (
          <CallableNoteHeaderRow notes={details?.userData?.notes} isMobile={isMobile} userDataReady={userDataReady} reqPrice={price?.reqPrice} />
        )}
        {details?.userData?.notes.map((
          note, index) => {
          const isLast = index === details?.userData?.notes.length - 1
          return (
            <CallNoteRow note={note} userDataReady={userDataReady} bond={bond} isMobile={isMobile} reqPrice={price.reqPrice} isLast={isLast} isFirst={index === 0} />
          )
        }
        )}

        {(!isMobile && (!userDataReady || (!details?.userData?.notes || details?.userData?.notes.length === 0)) && (
          <ActionContainerNoBond>
            <Text width="20%" bold textAlign='center' marginLeft='20px' marginRight='20px'>Bond LP tokens to receive asset-backed Requiem Tokens</Text>
            <PreviewPanel
              isMobile={isMobile}
              thisBond={bond}
              reqPrice={price.reqPrice}
              chainId={chainId}
              account={account}
            />
            {account && (<BondingAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} isMobile={isMobile} reqPrice={price.reqPrice} otr />)}
          </ActionContainerNoBond>
        ))}
      </NoteContainer>
    </Container>
  )
}

export default ActionPanel
