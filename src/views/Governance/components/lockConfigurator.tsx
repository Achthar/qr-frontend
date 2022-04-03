/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'
import { prettifySeconds } from 'config'
import { Percent, TokenAmount } from '@requiemswap/sdk'
import { Button, Text, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal, useMatchBreakpoints, Dropdown } from '@requiemswap/uikit'
import { Lock } from 'state/governance/reducer'
import { AutoColumn, ColumnCenter } from 'components/Layout/Column'
import Select, { OptionProps } from 'components/Select/Select'
import Row from 'components/Row'
import { DateEntry, eomsUnix, fridaysUnix, timeConverter } from 'utils/time'



const Line = styled.hr`
  height: 1px;
  border:  none;
  background-color: grey;
  color: white;
  width: 80%;
  size: 0.1;
`;

const BorderCard = styled.div`
  border: solid 1px ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding: 16px;
`

const DropdownContainer = styled.div`
  margin-left:4px
  width: 100%;
  height: 24px;
  zoom: 0.66;
  -moz-transform: scale(0.66);
`

function sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}

export enum Action {
    selectLock,
    createLock,
    increaseTime,
    increaseAmount
}

interface SeparatorProps {
    text: string
}

const Separator: React.FC<SeparatorProps> = ({
    text
}) => {
    return (
        <>
            <Flex flexWrap="wrap" justifyContent="space-evenly" flexDirection="row" marginBottom='5px' >
                <Text>{text}</Text> <Line />
            </Flex>
        </>)

}


interface ButtonContainerProps extends ButtonRowProps {
    splitAt: number
    selectedTimeFrame: string
}

interface LockConfiguratorProps {
    lock: Lock
    selectMaturity: (inp: number) => void
    startTime: number
    selectedMaturity: number
    now: number
    isMobile: boolean
    action: Action
}

interface ButtonRowProps {
    selectMaturity: (inp: number) => void
    maxTimeInput: number
    dates: DateEntry[]
}

const ButtonRow: React.FC<ButtonRowProps> = ({
    selectMaturity,
    maxTimeInput,
    dates
}) => {
    return (
        <>
            <Flex flexWrap="wrap" justifyContent="space-evenly" marginBottom='10px'>
                {dates.map(entry => {
                    return (
                        <Button variant="tertiary" scale="sm" onClick={() => selectMaturity(Math.min(entry.unix, maxTimeInput))} width='110px'>
                            {entry.month}
                        </Button>
                    )
                })}
            </Flex>
        </>)

}

const ButtonRowWeeklies: React.FC<ButtonRowProps> = ({
    selectMaturity,
    maxTimeInput,
    dates
}) => {
    return (
        <>
            <Flex flexWrap="wrap" justifyContent="space-evenly" marginBottom='10px'>
                {dates.map(entry => {
                    return (
                        <Button variant="tertiary" scale="sm" onClick={() => selectMaturity(Math.min(entry.unix, maxTimeInput))} width='110px'>
                            {`${entry.month} ${entry.date}`}
                        </Button>
                    )
                })}
            </Flex>
        </>
    )
}



const ButtonContainerYear = ({
    splitAt,
    selectMaturity,
    selectedTimeFrame,
    maxTimeInput,
    dates
}: ButtonContainerProps) => {
    const dateRows = sliceIntoChunks(dates.filter(date => date.year === Number(selectedTimeFrame)), splitAt)
    return (
        < >
            {dateRows.map(dateRow => {
                return <ButtonRow selectMaturity={selectMaturity} maxTimeInput={maxTimeInput} dates={dateRow} />
            })}
        </>
    )

}

const ButtonContainerMonths = ({
    splitAt,
    selectMaturity,
    selectedTimeFrame,
    maxTimeInput,
    dates
}: ButtonContainerProps) => {
    const dateRows = sliceIntoChunks(dates.filter(date => date.aod === selectedTimeFrame), splitAt)
    return (
        < >
            {dateRows.map(dateRow => {
                return <ButtonRowWeeklies selectMaturity={selectMaturity} maxTimeInput={maxTimeInput} dates={dateRow} />
            })}
        </>
    )

}


const ScaleSelection = (selectedScale: Scale, selectScale: (scale: Scale) => void) => {
    return (
        <Flex justifyContent="space-evenly">
            <Button
                marginRight='4px'
                width='80px'
                height='24px'
                value="option 1"
                onClick={() => { selectScale(Scale.weekly) }}
                variant={selectedScale === Scale.monthly ? "secondary" : "primary"}
                disabled={selectedScale === Scale.weekly}
            >
                Weekly
            </Button>
            <Button
                marginRight='4px'
                width='80px'
                height='24px'
                value="Button 2"
                onClick={() => { selectScale(Scale.monthly) }}
                variant={selectedScale === Scale.weekly ? "secondary" : "primary"}
                disabled={selectedScale === Scale.monthly}
            >
                Monthly
            </Button>
        </Flex>
    )
}

const DropDownYears = (years: number[], selectYear: ({ label, value }: OptionProps) => void) => {

    return (
        <DropdownContainer>
            <Select options={years.map((y) => { return { label: String(y), value: y } })} onChange={selectYear} />
        </DropdownContainer>
    )
}

const DropDownMonths = (months: string[], selectMonth: ({ label, value }: OptionProps) => void) => {
    return (
        <DropdownContainer>
            <Select options={months.map((y) => { return { label: String(y), value: y } })} onChange={selectMonth} />
        </DropdownContainer>
    )
}


enum Scale {
    weekly,
    monthly
}

export const LockConfigurator: React.FC<LockConfiguratorProps> = ({
    lock,
    selectMaturity,
    startTime,
    selectedMaturity,
    now,
    isMobile,
    action
}) => {

    const [selectedScale, selectScale] = useState(Scale.monthly)
    const dates = useMemo(() => { return (eomsUnix()) }, [])

    const years = [...new Set(dates.map(d => d.year))]

    const [selectedMonth, selectMonth] = useState(String(dates[0].aod))
    const [selectedYear, selectYear] = useState(String(dates[0].year))

    const onSelectYear = useCallback(({ label, value }: OptionProps) => { return selectYear(value) }, [selectYear])
    const onSelectMonth = useCallback(({ label, value }: OptionProps) => { return selectMonth(value) }, [selectMonth])

    const fridays = useMemo(() => { return (fridaysUnix().slice(0, 48)) }, [])
    const months = [...new Set(fridays.map(d => d.aod))]

    const day = 24 * 3600
    const timeDiff = useMemo(() => { return (selectedMaturity - now) / 3600 / 24 }, [selectedMaturity, now])

    const max = selectedScale === Scale.monthly ? dates[dates.length - 1].unix : dates[dates.length - 1].unix

    return (
        <AutoColumn gap="20px">
            <BorderCard>
                {(action !== Action.increaseAmount) ?
                    (
                        <>
                            <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                                {action !== Action.increaseTime ? 'Define your lock period and amount to lock.' : ' Select time to add to your lock.'}
                            </Text>

                            <Text fontSize="25px" bold mb="16px" style={{ lineHeight: 1 }}>
                                {action !== Action.increaseTime ? `${Math.round(timeDiff * 100 / 365) / 100} year(s)` :
                                    `Extend lock to ${Math.round((timeDiff + timeDiff / 3600 / 24) * 100 / 365) / 100} year(s)`}
                            </Text>
                            <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                                {action !== Action.increaseTime ? `${Math.round(timeDiff * 100) / 100} days` : ` Add ${Math.round(timeDiff * 100) / 100} days to Lock`}
                            </Text>

                            <Slider
                                name="maturity-selector"
                                min={startTime}
                                max={max}
                                step={day}
                                value={selectedMaturity}
                                onValueChanged={(val) => { selectMaturity(val) }}
                                mb="16px"
                                width={isMobile ? '90%' : '95%'}
                            />
                            {!isMobile ? (
                                <>
                                    <Flex marginBottom='10px' alignContent='right'>
                                        {ScaleSelection(selectedScale, selectScale)}


                                        {(selectedScale === Scale.weekly ? DropDownMonths(months, onSelectMonth)
                                            : DropDownYears(years, onSelectYear))}
                                    </Flex>

                                    {selectedScale === Scale.monthly ?
                                        ButtonContainerYear({
                                            splitAt: 3,
                                            selectMaturity,
                                            maxTimeInput: max,
                                            dates,
                                            selectedTimeFrame: selectedYear
                                        }) :
                                        ButtonContainerMonths({
                                            splitAt: 3,
                                            selectMaturity,
                                            maxTimeInput: max,
                                            dates: fridays,
                                            selectedTimeFrame: selectedMonth
                                        })
                                    }
                                </>
                            ) : (
                                <>
                                    <Flex justifyContent="space-evenly" marginBottom='10px'>
                                        {ScaleSelection(selectedScale, selectScale)}
                                        {(selectedScale === Scale.weekly ? DropDownMonths(months, onSelectMonth) : DropDownYears(years, onSelectYear))}

                                    </Flex>
                                    {selectedScale === Scale.monthly ?
                                        ButtonContainerYear({
                                            splitAt: 2,
                                            selectMaturity,
                                            maxTimeInput: max,
                                            dates,
                                            selectedTimeFrame: selectedYear
                                        }) :
                                        ButtonContainerMonths({
                                            splitAt: 2,
                                            selectMaturity,
                                            maxTimeInput: max,
                                            dates: fridays,
                                            selectedTimeFrame: selectedMonth
                                        })
                                    }
                                </>)
                            }
                        </>
                    ) : lock && (
                        <>
                            <Row width='90%' height='50px' gap='9px' marginTop='7px' align="space-evenly" >
                                <Text fontSize="20px" mb="16px" style={{ lineHeight: 1 }} marginRight='5px' width='120px'>
                                    Maturity:
                                </Text>
                                <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                                    {`${timeConverter(lock.end)}`}
                                </Text>
                            </Row>
                            {lock.end - now > 0 ? (<Row width='90%' height='50px' gap='9px' marginTop='7px' align="space-evenly">
                                <Text fontSize="20px" mb="16px" style={{ lineHeight: 1 }} marginRight='5px' width='120px'>
                                    Remaining:
                                </Text>
                                <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                                    {`${prettifySeconds(lock.end - now, 'h')}`}
                                </Text>
                            </Row>) : (
                                <Text fontSize="20px" bold mb="16px" style={{ lineHeight: 1 }}>
                                    Lock expired
                                </Text>)}

                        </>
                    )
                }
            </BorderCard>
        </AutoColumn>
    )
}
