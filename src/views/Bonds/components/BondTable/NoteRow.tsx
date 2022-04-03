import React, { useMemo } from 'react'
import styled from 'styled-components'
import { ChevronDownIcon, useMatchBreakpoints, Text } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { Bond, Note } from 'state/types'
import { prettifySeconds } from 'config'
import { timeConverter, timeConverterNoMinutes } from 'utils/time'
import { formatSerializedBigNumber } from 'utils/formatBalance'
import RedemptionAction from './Actions/RedemptionAction'

interface NoteProps {
    isMobile: boolean
    userDataReady: boolean
    note: Note
    bond: Bond
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
  padding-right: 8px;
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
  gap: 10px;
  padding-right: 8px;
  color: ${({ theme }) => theme.colors.primary};

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-right: 0px;
  }
`

const Container = styled.div`
  flex-direction: row;
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

const NoteRow: React.FC<NoteProps> = ({ note, userDataReady, bond, isMobile }) => {
    const { t } = useTranslation()
    const { isDesktop } = useMatchBreakpoints()

    const now = Math.round((new Date()).getTime() / 1000);
    const vestingTime = () => {
        const maturity = Number(note.matured)
        // return prettyVestingPeriod(chainId, currentBlock, Number(bond.userData.notes.matured));
        return (maturity - now > 0) ? prettifySeconds(maturity - now, "day") : 'Matured';
    };

    const vestingPeriod = () => {
        const vestingTerm = parseInt(bond.bondTerms.vesting);
        // const seconds = secondsUntilBlock(chainId, currentBlock, vestingBlock);
        return prettifySeconds(vestingTerm, "");
    };


    const payout = useMemo(() => { return formatSerializedBigNumber(note.payout, isMobile ? 3 : 5, 18) }, [note.payout, isMobile])
    const created = useMemo(() => { return timeConverterNoMinutes(Number(note.created)) }, [note.created])
    const expiry = useMemo(() => { return timeConverterNoMinutes(Number(note.matured)) }, [note.matured])
    if (isMobile) {
        return (
            <Container>
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
                <RedemptionAction {...bond} userDataReady={userDataReady} noteIndex={note.noteIndex} />
            </Container>
        )
    }


    return (
        <Container>
            <ContentRow>
                <DescriptionCol>
                    <Text>Created:</Text>
                    <Text>Expiry:</Text>
                </DescriptionCol>
                <DescriptionCol>
                    <Text>{expiry}</Text>
                    <Text>{created}</Text>
                </DescriptionCol>
            </ContentRow>
            <ContentRow>
                <DescriptionCol>
                    <Text>Payout:</Text>
                    <Text>Time to Maturity:</Text>
                </DescriptionCol>
                <DescriptionCol>
                    <Text>{payout}</Text>
                    <Text>{vestingTime()}</Text>
                </DescriptionCol>
            </ContentRow>
            <RedemptionAction {...bond} userDataReady={userDataReady} noteIndex={note.noteIndex} />
        </Container>
    )

}

export default NoteRow
