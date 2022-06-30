import React, { useMemo } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { ChevronDownIcon, useMatchBreakpoints, Text, Flex } from '@requiemswap/uikit'
import { CallNote } from 'state/types'
import { prettifySeconds } from 'config'
import { timeConverter, timeConverterNoMinutes, timeConverterNoYear } from 'utils/time'
import { formatSerializedBigNumber } from 'utils/formatBalance'
import BigNumber from 'bignumber.js'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { bondConfig } from 'config/constants/bonds'
import { calculateUserPay, calculateUserPayClosed, getConfigForVanillaNote } from 'utils/bondUtils'
import PoolLogo from 'components/Logo/PoolLogo'
import { deserializeToken } from 'state/user/hooks/helpers'
import { useClosedCallMarkets, useGetOracleData } from 'state/bonds/hooks'
import { useOracleState } from 'state/oracles/hooks'
import { TokenImage } from 'components/TokenImage'
import { ABREQ } from 'config/constants/tokens'
import { getTokenLogoURLFromSymbol } from 'utils/getTokenLogoURL'
import Logo from 'components/Logo/Logo'
import GeneralRedemption from './Actions/GeneralRedemptionAction'
import GeneralRedemptionMulti from './Actions/GeneralRedemptionActionMulti'

/**
 * Implementation for showing positions of users that are not assigned to live markets anymore
 * Should provide:
 * - claim function for single position
 * - claim function for all matured ones
 * - sort notes
 * - filter
 */

interface CallNoteProps {
    isMobile: boolean
    userDataReady: boolean
    note: CallNote
    reqPrice: number
    isFirst: boolean
    isLast: boolean
}

interface CallNoteHeaderProps {
    userDataReady: boolean
    isMobile: boolean
    notes: CallNote[]
    reqPrice: number
}


const ContentCol = styled.div`
  flex-direction: column;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;
  padding-right: 8px;
  color: ${({ theme }) => theme.colors.primary};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
  }
`

const DescriptionCol = styled.div`
  flex-direction: column;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;
  padding-right: 2px;
  color: ${({ theme }) => theme.colors.primary};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
    margin-top: 1px;
  }
`

const DescriptionColHeader = styled.div`
  flex-direction: column;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;
  padding-right: 2px;
  padding-left: 20px;
  color: ${({ theme }) => theme.colors.primary};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
    margin-top: 1px;
  }
`

const ContentRow = styled.div`
  flex-direction: row;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 5px;
  padding-right: 2px;
  padding-left: 7px;
  color: ${({ theme }) => theme.colors.primary};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
  }
`

const Container = styled.div<{ isFirst: boolean, isLast: boolean, isMobile: boolean }>`
  border-left: 2px solid   #737373 ;
  border-right: 2px solid   #737373 ;
  ${({ isLast }) => isLast ? 'border-bottom: 2px solid   #737373 ;' : ''}
  border-top-left-radius: ${({ isFirst }) => isFirst ? '16px' : '0px'};
  border-top-right-radius: ${({ isFirst }) => isFirst ? '16px' : '0px'};
  border-bottom-left-radius: ${({ isLast }) => isLast ? '16px' : '0px'};
  border-bottom-right-radius: ${({ isLast }) => isLast ? '16px' : '0px'};
  background:${({ theme }) => theme.colors.overlay};
  ${({ isLast }) => isLast ? '' : 'margin-bottom: 5px;'}
  ${({ isMobile }) => isMobile ? '' : 'padding-left: 20px;'}
  align-items:center;
  flex-direction: row;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;
  padding-right: 8px;
  color: ${({ theme }) => theme.colors.overlay};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
  }
`

const HeaderContainer = styled.div`
  border-top: 2px solid   #737373 ;
  border-left: 2px solid   #737373 ;
  border-right: 2px solid   #737373 ;
  border-top-left-radius:  16px ;
  border-top-right-radius: 16px ;
  margin-bottom:5px;
  background: linear-gradient(${({ theme }) => theme.colors.backgroundAlt},${({ theme }) => theme.colors.overlay}) ;
  align-items:center;
  flex-direction: row;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px;
  color: ${({ theme }) => theme.colors.backgroundAlt};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
  }
`

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

const GeneralNoteContainer = styled.div<{ isMobile: boolean, expanded: boolean }>`
  margin-top:5px;
  position:relative;
  animation: ${({ expanded }) =>
        expanded
            ? css`
          ${expandAnimation} 300ms linear forwards
        `
            : css`
          ${collapseAnimation} 300ms linear forwards
        `};
  width:100%;
  align-self: center;
  display: flex;
  height: 100%;
  flex-direction: column;
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

    
const StyledLogo = styled(Logo) <{ size: string }>`
width: ${ ({ size }) => size };
height: ${ ({ size }) => size };
`


export const CallNoteHeaderRow: React.FC<CallNoteHeaderProps> = ({ notes, isMobile, reqPrice }) => {


    const [totalPayout, avgVesting] = useMemo(() => {
        const now = Math.round((new Date()).getTime() / 1000);
        const payouts = notes.map((note) => Number(formatSerializedBigNumber(note.payout, isMobile ? 3 : 5, 18)))
        const vestingTimes = notes.map(note => Number(note.matured) - now)
        let sumPa = 0
        let sumMulti = 0
        for (let i = 0; i < notes.length; i++) {
            const payout = payouts[i]
            sumPa += payout
            sumMulti += payout * vestingTimes[i]

        }
        return [sumPa, sumMulti / sumPa]

    }, [notes, isMobile])


    if (isMobile) {
        return (
            <HeaderContainer>
                <ContentRow>
                    <DescriptionCol>
                        <Text>Total Payout</Text>
                        <Text>{(totalPayout * reqPrice).toLocaleString()}$</Text>
                    </DescriptionCol>
                    <DescriptionCol>
                        <Text>Average Maturity</Text>
                        <Text>{prettifySeconds(avgVesting, 'day')}</Text>
                    </DescriptionCol>
                </ContentRow>
            </HeaderContainer>
        )
    }


    return (
        <HeaderContainer>
            <DescriptionColHeader>
                <Text>Total Payout</Text>
                <Text>Average Maturity</Text>

            </DescriptionColHeader>
            <DescriptionCol>
                <Text>{totalPayout.toLocaleString()} ABREQ / {(Math.round(totalPayout * reqPrice * 100) / 100).toLocaleString()}$</Text>
                <Text>{prettifySeconds(avgVesting, 'd')}</Text>
            </DescriptionCol>
            <DescriptionCol>
                <GeneralRedemptionMulti notes={notes} userDataReady />
            </DescriptionCol>
        </HeaderContainer>
    )

}




const CallNoteRow: React.FC<CallNoteProps> = ({ isLast, isFirst, note, userDataReady, isMobile, reqPrice }) => {
    const { chainId } = useNetworkState()
    const closed = useClosedCallMarkets()

    const now = Math.round((new Date()).getTime() / 1000);
    const vestingTime = () => {
        const maturity = Number(note.matured)
        return (maturity - now > 0) ? prettifySeconds(maturity - now, "day") : 'Matured';
    };

    const payout = useMemo(() => { return formatSerializedBigNumber(note.payout, isMobile ? 3 : 5, 18) }, [note.payout, isMobile])
    const created = useMemo(() => { return timeConverterNoYear(Number(note.created)) }, [note.created])
    const expiry = useMemo(() => { return timeConverterNoYear(Number(note.matured)) }, [note.matured])


    const cfg = useMemo(() => bondConfig(chainId), [chainId])
    const config = getConfigForVanillaNote(chainId, note, closed, cfg)


    const oracleState = useOracleState(chainId)

    const oracleData = useGetOracleData(chainId, closed[note?.marketId]?.market?.underlying, oracleState.oracles)

    const [moneynessPerc, optPayout] = useMemo(() => {
        const { moneyness, pay } = calculateUserPayClosed(note, closed[note?.marketId]?.terms, oracleData?.value)
        return [Math.round(moneyness * 10000) / 100, formatSerializedBigNumber(moneyness > 0 ? closed[note?.marketId]?.terms.payoffPercentage : '0', isMobile ? 3 : 5, 18)]

    }, [note, closed, oracleData, isMobile])

    if (isMobile) {
        return (
            <Container isLast={isLast} isFirst={false} isMobile={isMobile}>
                <ContentRow>
                    <DescriptionCol>
                        <Text>Payout:</Text>
                        <Text>End: </Text>
                    </DescriptionCol>
                    <DescriptionCol>
                        <Text>{payout}</Text>
                        <Text>{vestingTime()}</Text>
                    </DescriptionCol>
                </ContentRow>
                <GeneralRedemption userDataReady={userDataReady} note={note} reqPrice={new BigNumber(reqPrice)} />
            </Container>
        )
    }


    return (
        <Container isLast={isLast} isFirst={false} isMobile={isMobile}>
            <Flex flexDirection='column' width='35%' justifyContent='center'>
                {config?.tokens && (<PoolLogo tokens={config?.tokens?.map(tk => deserializeToken(tk))} overlap='-5px' size={16} />)}
                <Text bold fontSize='12px' textAlign='center'>{config?.name}</Text>
                {/* <Flex flexDirection="column" mr='3px' ml='3px'> */}
                <Text marginLeft='1px' bold fontSize='12px' textAlign='center'>{`${ oracleData?.token } -Linked`}</Text>
                <Flex flexDirection="row" alignSelf='center'>
                    <StyledLogo size='15px' srcs={[getTokenLogoURLFromSymbol(oracleData?.token)]} alt={`${ oracleData?.token ?? 'token' } logo`} />
                    <Text marginLeft='1px' bold fontSize='10px'>{`${ oracleData && (Math.round(Number(oracleData?.value) / 10 ** oracleData?.decimals * 100) / 100).toLocaleString() } `}</Text>
                </Flex>
                {/* </Flex> */}
            </Flex>
            <ContentRow>
                <DescriptionCol>
                    <Text>Created:</Text>
                    <Text>Expiry:</Text>
                    <Text>Claimable in:</Text>
                </DescriptionCol>
                <DescriptionCol>
                    <Text>{created}</Text>
                    <Text>{expiry}</Text>
                    <Text>{vestingTime()}</Text>
                </DescriptionCol>
            </ContentRow>
            <ContentRow>
                <DescriptionCol>
                    <Text>Moneyness:</Text>
                    <Text>Option Payout:</Text>
                    <Text>Notional Payout:</Text>

                </DescriptionCol>
                <DescriptionCol>
                    <Text color={moneynessPerc > 0 ? 'green' : 'red'}>{moneynessPerc.toLocaleString()}%</Text>
                    <Flex flexDirection='row'>  <TokenImage token={ABREQ[chainId]} chainId={chainId} width={22} height={22} marginTop='1px' /><Text marginLeft='3px'>{optPayout}</Text></Flex>
                    <Flex flexDirection='row'>  <TokenImage token={ABREQ[chainId]} chainId={chainId} width={22} height={22} marginTop='1px' /><Text marginLeft='3px'>{payout}</Text></Flex>
                </DescriptionCol>
            </ContentRow>
            <GeneralRedemption userDataReady={userDataReady} note={note} reqPrice={new BigNumber(reqPrice)} />
        </Container>
    )

}



function compareMaturities(a: CallNote, b: CallNote) {
    if (a.matured < b.matured) {
        return -1;
    }
    if (a.matured > b.matured) {
        return 1;
    }
    return 0;
}

export const CallNoteTable: React.FunctionComponent<{ notes: CallNote[], reqPrice: number, userDataReady: boolean, expanded: boolean }> = ({
    notes, reqPrice, userDataReady, expanded
}) => {

    const { isMobile } = useMatchBreakpoints()
    let orderedNotes = useMemo(() => notes.slice(), [notes])
    orderedNotes = useMemo(() => { return orderedNotes.sort((a, b) => a.matured - b.matured) }, [orderedNotes])
    return (
        <GeneralNoteContainer isMobile={isMobile} expanded={expanded}>
            {notes.length > 0 && (
                <CallNoteHeaderRow notes={notes} isMobile={isMobile} userDataReady={userDataReady} reqPrice={reqPrice} />
            )}
            {orderedNotes.map((
                note, index) => {
                const isLast = index === notes.length - 1
                return (
                    <CallNoteRow note={note} userDataReady={userDataReady} isMobile={isMobile} reqPrice={reqPrice} isLast={isLast} isFirst={index === 0} />
                )
            }
            )}

        </GeneralNoteContainer>
    )
}

