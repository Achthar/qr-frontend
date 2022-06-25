import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { Button, Flex, Input, Skeleton, Text } from '@requiemswap/uikit'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { TokenImage } from 'components/TokenImage'
import { ABREQ } from 'config/constants/tokens'
import { prettifySeconds } from 'config'
import PoolLogo from 'components/Logo/PoolLogo'
import { deserializeToken } from 'state/user/hooks/helpers'
import { priceBonding } from 'utils/bondUtils'
import { Bond } from 'state/types'


export const InputContainer = styled.div<{ isMobile: boolean }>`
  padding: 3px;
  width: ${({ isMobile }) => isMobile ? '90%' : '300px'};
  border: 2px solid ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaQueries.sm} {
    max-height: 140px;
  }

  ${({ theme }) => theme.mediaQueries.xl} {

    max-height: 150px;
  }
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


export const PreviewPanelContainer = styled.div`
  padding: 1px;
  border-radius: 2px;
  border: solid 5px #fea43022;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaQueries.sm} {
    margin-left: 1px;
    margin-right: 1px;
    margin-bottom: 0;
    max-height: 100px;
  }

  ${({ theme }) => theme.mediaQueries.xl} {
    margin-left: 1px;
    margin-right: 0;
    margin-bottom: 0;
    max-height: 100px;
  }
`

const StyledInput = styled(Input)`
  box-shadow: none;
  width: 250px;
  margin: 0 8px;
  padding: 0 8px;
  border: none;

  ${({ theme }) => theme.mediaQueries.xs} {
    width: 80px;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    width: auto;
  }
`


interface PreviewPanelProps {
  reqPrice: number
  thisBond: Bond
  isMobile: boolean
  chainId: number
  account: string
}

export const PreviewPanel: React.FunctionComponent<PreviewPanelProps> = ({
  thisBond,
  isMobile,
  reqPrice,
  chainId,
  account
}) => {
  // const { account, chainId } = useActiveWeb3React()

  const [val, setVal] = useState('')

  // calculates the payout fom the input and the payout itself in USD equivalent tokens
  const [payout, inputUSD] = useMemo(() => {
    let returnVal = ethers.BigNumber.from(0)
    let inpUSD = ethers.BigNumber.from(0)
    const formattedInput = new BigNumber(val).multipliedBy(new BigNumber('10').pow(18)).toString()
    try {
      returnVal = priceBonding(
        ethers.BigNumber.from(val === '' ? 0 : formattedInput),
        thisBond
      )
    }
    catch (Error) {
      console.log(Error)
    }

    try {
      inpUSD = ethers.BigNumber.from(thisBond.purchasedInQuote).mul(formattedInput).div(thisBond.market.purchased)
    } catch (Error) {
      console.log(Error)
    }

    return [Number(ethers.utils.formatEther(returnVal)), Number(ethers.utils.formatEther(inpUSD))]
  }, [
    val,
    thisBond
  ])

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.validity.valid) {
        setVal(e.currentTarget.value.replace(/,/g, '.'))
      }
    },
    [setVal],
  )
  const decimals = 18
  return (
    <InputContainer isMobile={isMobile}>
      <Flex flexDirection="row" width='100%' justifyContent='space-between' alignItems='center' marginBottom='5px'>
        <Text bold textAlign='left' marginLeft='3px'>
          Bonding preview
        </Text>
        {!account && (<ConnectWalletButton style={{ borderRadius: '16px', width: '150px', height: '25px', fontSize: '12px', textAlign: 'center' }} />)}
      </Flex>
      <Flex flexDirection="column" width='100%' justifyContent='space-between'>

        <Flex flexDirection="row" width='100%' justifyContent='space-between' alignItems='space-between' marginTop='5px'>
          <Text width='30%' fontSize={isMobile ? '13px' : '15px'} marginLeft='5px' marginRight='3px' height='20px'>
            You pay
          </Text>
          {/* <Flex flexDirection="row" width='100%' justifyContent='center' alignItems='center'> */}
          <StyledInput
            pattern={`^[0-9]*[.,]?[0-9]{0,${decimals}}$`}
            inputMode="decimal"
            step="any"
            min="0"
            onChange={handleChange}
            placeholder="0"
            value={val}
            style={{ height: '20px', borderRadius: '3px', width: '40%', alignSelf: 'center' }}
          />
          {thisBond?.tokens && (<PoolLogo tokens={thisBond.tokens.map(t => deserializeToken(t))} overlap='-8px' size={15} width='20px' />)}
          {/* </Flex> */}
          <Text fontSize='10px' textAlign='center' width='30%'>
            {`~$${(Math.round(inputUSD))?.toLocaleString()}`}
          </Text>
        </Flex>

        <Flex flexDirection="row" width='100%' justifyContent='space-between' alignItems='space-between' marginTop='5px'>
          <Text width='30%' fontSize={isMobile ? '13px' : '15px'} marginLeft='5px' marginRight='3px' height='20px'>
            You get
          </Text>
          <StyledInput
            pattern={`^[0-9]*[.,]?[0-9]{0,${decimals}}$`}
            inputMode="none"
            step="any"
            min="0"
            onChange={() => null}
            placeholder="0"
            value={`${thisBond.bondPrice > 0 ? (Math.round(payout / thisBond.bondPrice * 100) / 100)?.toLocaleString() : ''}`}
            style={{ height: '20px', borderRadius: '3px', width: '40%' }}
          />

          <TokenImage token={ABREQ[chainId]} chainId={chainId} width={20} height={20} />
          <Text fontSize='10px' textAlign='center' width='30%'>
            {thisBond.bondPrice > 0 ? `~$${Math.round(payout * reqPrice / thisBond.bondPrice)?.toLocaleString()}` : ''}
          </Text>

        </Flex>

        <Flex flexDirection="row" width='70%' justifyContent='space-between' marginTop='5px'>
          <Text width='50%' fontSize={isMobile ? '13px' : '15px'} marginLeft='5px'>
            {isMobile ? 'Your Profits' : 'Generated Profits'}
          </Text>
          <Text fontSize={isMobile ? '13px' : '15px'} textAlign='center' color='green' width='50%'>
            {thisBond.bondPrice > 0 ? `+ $${(Math.round((payout * reqPrice / thisBond.bondPrice - inputUSD) * 100) / 100).toLocaleString()}` : ''}
          </Text>
        </Flex>

        <Flex flexDirection="row" width='70%' justifyContent='space-between' marginTop='5px'>
          <Text width='50%' fontSize={isMobile ? '13px' : '15px'} marginLeft='5px'>
            Vesting Term
          </Text>
          <Text textAlign='center' width='50%' fontSize={isMobile ? '13px' : '15px'}>
            {thisBond?.vestingTerm ? `${prettifySeconds(thisBond.vestingTerm)}` : ''}
          </Text>
        </Flex>

      </Flex>
    </InputContainer >
  )

}
