import { Currency, Token } from '@requiemswap/sdk'
import { Flex } from '@requiemswap/uikit'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import React from 'react'
import styled from 'styled-components'

import { sliceIntoChunks } from 'utils/arraySlicer'
import CurrencyLogo from './CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean }>`
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin-right: ${({ margin }) => margin && '4px'}
  aspect-ratio: 1;
`

interface PoolLogoProps {
  margin?: boolean
  size?: number
  tokens?: Token[]
  tokensInRow?: number
}

export default function PoolLogo({
  tokens,
  size = 20,
  margin = false,
  tokensInRow = 2
}: PoolLogoProps) {
  const chainId = tokens?.[0].chainId ?? 43113
  return (
    <AutoColumn>
      {tokens && sliceIntoChunks(tokens, tokensInRow).map(ts => {

        return (
          <Wrapper margin={margin}>
            <Flex alignContent='center' justifyContent='flex-end'>
              {ts && ts.map(t => {
                return (
                  <CurrencyLogo chainId={chainId} currency={t} size={`${size.toString()}px`} />
                )
              })}
            </Flex>
          </Wrapper>
        )
      })}
    </AutoColumn>
  )
}
