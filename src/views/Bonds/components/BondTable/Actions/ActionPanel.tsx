import React from 'react'
import styled, { keyframes, css } from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import { LinkExternal, Text, useMatchBreakpoints } from '@requiemswap/uikit'
import { BondWithStakedValue } from 'views/Bonds/components/BondCard/BondCard'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import { getAddress } from 'utils/addressHelpers'
import { getNetworkExplorerLink } from 'utils'
import { CommunityTag, CoreTag, DualTag } from 'components/Tags'
import { useNetworkState } from 'state/globalNetwork/hooks'
import getChain from 'utils/getChain'
import HarvestAction from './HarvestAction'
import BondingAction from './BondingAction'
import ClaimAction from './ClaimAction'
// import RedemptionAction from './RedemptionAction'
import Roi, { RoiProps } from '../Roi'
import NoteRow from '../NoteRow'


export interface ActionPanelProps {
  roi: RoiProps
  details: BondWithStakedValue
  userDataReady: boolean
  expanded: boolean
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
  padding: 24px;

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
  align-items: center;
  flex-direction: ${({ isMobile }) => isMobile ? 'row' : 'column'};
  width: ${({ isMobile }) => isMobile ? '300px' : '100%'};
  display: flex;
  justify-content: space-between;

  ${({ theme }) => theme.mediaQueries.sm} {
    justify-content: flex-start;
  }
`

const TagsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 25px;

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
  display: flex;
  flex-direction: column;
  padding: 2px;
  ${({ isMobile }) => isMobile && `
  overflow-y: auto;
  ::-webkit-scrollbar {
    width: 12px;
  }`}
`

const GeneralActionContainer = styled.div`
  display: flex;
  fle-wrap: nowrap;
  flex-direction: column;
  width: 100%;
  margin-top:10px;
`

const GeneralActionContainerMobile = styled.div`
  display: flex;
  fle-wrap: nowrap;
  flex-direction: row;
  width: 100%;
  margin-top:10px;
`

const ActionContainerNoBond = styled.div`
  align-items: center;
  display: flex;
  fle-wrap: nowrap;
  flex-direction: row;
  width: 80%;
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
  height: 1px;
  background-color: ${({ theme }) => theme.colors.text};
  color: white;
  width: 100%;
  size: 0.1;
`;

const ActionPanel: React.FunctionComponent<ActionPanelProps> = ({
  details,
  roi,
  userDataReady,
  expanded,
}) => {
  const bond = details

  const { isMobile, isTablet, isDesktop } = useMatchBreakpoints()
  const { chainId } = useNetworkState()
  const { t } = useTranslation()
  // const { quoteToken, token, dual } = bond
  const lpLabel = 'Bond'
  const chain = getChain(chainId)
  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: bond?.quoteToken?.address,
    tokenAddress: bond?.token?.address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })
  const lpAddress = getAddress(chainId, bond.reserveAddress)
  const explorer = getNetworkExplorerLink(lpAddress, 'address')
  const info = `https://requiem.info/pool/${lpAddress}`

  return (
    <Container expanded={expanded} isMobile={isMobile}>
      <InfoContainer>
        <StakeContainer isMobile={isMobile}>
          <StyledLinkExternal href={`/${chain}/add/${liquidityUrlPathParts}`}>
            Get LP for Bond
          </StyledLinkExternal>
          <StyledLinkExternal href={explorer}>{t('View Contract')}</StyledLinkExternal>
        </StakeContainer>


        <TagsContainer>
          <CoreTag />
        </TagsContainer>
        {!isMobile && details?.userData?.notes && details?.userData?.notes.length > 0 && (
          <GeneralActionContainer>
            <BondingAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} displayApr={roi.value} isMobile={isMobile} />
            <ClaimAction
              {...bond}
              userDataReady={userDataReady}
              lpLabel={lpLabel}
              displayApr={roi.value}
              isMobile={isMobile}
              noBond={details?.userData?.notes.length === 0}
            />
          </GeneralActionContainer>
        )}
        {
          isMobile && (
            <GeneralActionContainerMobile>
              <BondingAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} displayApr={roi.value} isMobile={isMobile} />
              <ClaimAction
                {...bond}
                userDataReady={userDataReady}
                lpLabel={lpLabel}
                displayApr={roi.value}
                isMobile={isMobile}
                noBond={details?.userData?.notes.length === 0}
              />
            </GeneralActionContainerMobile>
          )
        }
      </InfoContainer>

      <NoteContainer isMobile={isMobile}>
        {details?.userData?.notes.map((
          note, index) => {
          const isLast = index === details?.userData?.notes.length - 1
          return (<>
            <NoteRow note={note} userDataReady={userDataReady} bond={bond} isMobile={isMobile} />
            {!isLast && (<Line />)}
          </>)
        }
        )}

        {(!isMobile && (!details?.userData?.notes || details?.userData?.notes.length === 0) && (
          <ActionContainerNoBond>
            <Text width="30%" bold textAlign='center' marginLeft='50px'>Bond LP tokens to receive asset-backed Requiem Tokens</Text>
            <ActionContainerNoBondButton>
              <BondingAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} displayApr={roi.value} isMobile={isMobile} />
            </ActionContainerNoBondButton>
          </ActionContainerNoBond>
        ))}

        {/* <RedemptionAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} displayApr={roi.value} noteIndex={0} />
        <BondingAction {...bond} userDataReady={userDataReady} lpLabel={lpLabel} displayApr={roi.value} /> */}
      </NoteContainer>
    </Container>
  )
}

export default ActionPanel
