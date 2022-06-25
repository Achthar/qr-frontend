import React, { useMemo } from 'react'
import styled from 'styled-components'
import { ChevronDownIcon, useMatchBreakpoints, Text } from '@requiemswap/uikit'
import { CallNote } from 'state/types'
import { prettifySeconds } from 'config'
import { timeConverter, timeConverterNoMinutes } from 'utils/time'
import { formatSerializedBigNumber } from 'utils/formatBalance'
import BigNumber from 'bignumber.js'
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

const GeneralNoteContainer = styled.div<{ isMobile: boolean }>`
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

    const now = Math.round((new Date()).getTime() / 1000);
    const vestingTime = () => {
        const maturity = Number(note.matured)
        return (maturity - now > 0) ? prettifySeconds(maturity - now, "day") : 'Matured';
    };

    const payout = useMemo(() => { return formatSerializedBigNumber(note.payout, isMobile ? 3 : 5, 18) }, [note.payout, isMobile])
    const created = useMemo(() => { return timeConverterNoMinutes(Number(note.created)) }, [note.created])
    const expiry = useMemo(() => { return timeConverterNoMinutes(Number(note.matured)) }, [note.matured])

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
            <ContentRow>
                <DescriptionCol>
                    <Text>Created:</Text>
                    <Text>Expiry:</Text>
                </DescriptionCol>
                <DescriptionCol>
                    <Text>{created}</Text>
                    <Text>{expiry}</Text>
                </DescriptionCol>
            </ContentRow>
            <ContentRow>
                <DescriptionCol>
                    <Text>Payout in ABREQ:</Text>
                    <Text>Time to Maturity:</Text>
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



function compareMaturities(a: CallNote, b: CallNote) {
    if (a.matured < b.matured) {
        return -1;
    }
    if (a.matured > b.matured) {
        return 1;
    }
    return 0;
}

export const CallNoteTable: React.FunctionComponent<{ notes: CallNote[], reqPrice: number, userDataReady: boolean }> = ({ notes, reqPrice, userDataReady
}) => {

    const { isMobile } = useMatchBreakpoints()
    let orderedNotes = useMemo(() => notes.slice(), [notes])
    orderedNotes = useMemo(() => { return orderedNotes.sort((a, b) => a.matured - b.matured) }, [orderedNotes])
    return (
        <GeneralNoteContainer isMobile={isMobile}>
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

