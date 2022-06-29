import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { Button, Flex, Input, Skeleton, Text } from '@requiemswap/uikit'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { fetchCallBondUserDataAsync } from 'state/bonds'
import { prettifySeconds } from 'config'
import PoolLogo from 'components/Logo/PoolLogo'
import { deserializeToken } from 'state/user/hooks/helpers'
import { useAppDispatch } from 'state'
import { TokenImage } from 'components/TokenImage'
import { ABREQ } from 'config/constants/tokens'
import { priceBonding } from 'utils/bondUtils'
import { CallBond } from 'state/types'
import { useCallBondFromBondIds } from 'state/bonds/hooks'
import { useRedeemCallNotes } from 'views/Bonds/hooks/callBond/useRedeemBond'
import { ActionContent } from './styles'



export const InputContainer = styled.div<{ isMobile: boolean }>`
  padding: 3px;
  width: ${({ isMobile }) => isMobile ? '90%' : '80%'};
  border: 2px solid ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 16px;

  ${({ theme }) => theme.mediaQueries.sm} {
    max-height: 110px;
  }

  ${({ theme }) => theme.mediaQueries.xl} {

    max-height: 110px;
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


export const PreviewPanel = styled.div`
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


interface RedeemMultiProps {
  userDataReady: boolean
  indexes: number[]
  bondIds: number[]
  reqPrice: number
  thisBond: CallBond
  isMobile: boolean
  account: string
  chainId: number
  hasPosition: boolean
}

const RedemptionMulti: React.FunctionComponent<RedeemMultiProps> = ({
  indexes,
  bondIds,
  thisBond,
  userDataReady,
  isMobile,
  reqPrice,
  account,
  chainId,
  hasPosition
}) => {

  const bonds = useCallBondFromBondIds(bondIds)
  const { onRedeem } = useRedeemCallNotes(chainId, account, indexes)

  const handleRedemption = async () => {
    try {
      await onRedeem()
      dispatch(fetchCallBondUserDataAsync({ chainId, account, bonds }))
    } catch (error) {
      console.log(error)
    }
  }


  const dispatch = useAppDispatch()

  const [val, setVal] = useState('')

  // calculates the payout fom the input and the payout itself in USD equivalent tokens
  const [payout, inputUSD] = useMemo(() => {
    let returnVal = ethers.BigNumber.from(0)
    let inpUSD = ethers.BigNumber.from(0)
    const formattedInput = new BigNumber(val).multipliedBy(new BigNumber('10').pow(18)).toString()
    if (!thisBond?.userData) return [Number(ethers.utils.formatEther(returnVal)), Number(ethers.utils.formatEther(inpUSD))]
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

  const isApproved = useMemo(() => {
    if (!thisBond.userData) return false
    return ethers.BigNumber.from(thisBond.userData.allowance).gt(0)
  },
    [thisBond.userData]
  )

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.validity.valid) {
        setVal(e.currentTarget.value.replace(/,/g, '.'))
      }
    },
    [setVal],
  )


  if (isMobile ? (!isApproved || (!hasPosition && !userDataReady)) : (!isApproved && !hasPosition && !userDataReady)) {
    const decimals = 18
    return (
      <InputContainer isMobile={isMobile}>
        <Flex flexDirection="column" width='100%' justifyContent='center'>
          <Flex flexDirection="row" width='100%' alignItems='space-between' justifyContent='space-between'>
            <Text fontSize='13px' marginLeft='5px'>
              You pay
            </Text>
            <Text bold marginRight='2px'>
              Preview
            </Text>
          </Flex>

          <Flex flexDirection="row" width='100%' justifyContent='center' alignItems='center'>
            <StyledInput
              pattern={`^[0-9]*[.,]?[0-9]{0,${decimals}}$`}
              inputMode="decimal"
              step="any"
              min="0"
              onChange={handleChange}
              placeholder="0"
              value={val}
              style={{ height: '15px', borderRadius: '3px', width: '70%' }}
            />
            {thisBond?.tokens && (<PoolLogo tokens={thisBond.tokens.map(t => deserializeToken(t))} overlap='-8px' width='30%' />)}
          </Flex>

          <Text fontSize='10px' marginTop='2px' textAlign='center'>
            {`~$${(Math.round(inputUSD * 100) / 100)?.toLocaleString()}`}
          </Text>

          <Text fontSize='13px' marginLeft='5px'>
            You will get
          </Text>

          <Flex flexDirection="row" width='100%' justifyContent='center' alignItems='center'>
            <StyledInput
              pattern={`^[0-9]*[.,]?[0-9]{0,${decimals}}$`}
              inputMode="none"
              step="any"
              min="0"
              onChange={() => null}
              placeholder="0"
              value={thisBond.bondPrice > 0 ? (Math.round(payout / thisBond.bondPrice * 100) / 100)?.toLocaleString() : ''}
              style={{ height: '15px', borderRadius: '3px', width: '70%' }}
            />
            <Flex style={{ width: '30%' }} flexDirection='row' justifyContent='center' alignItems='center'>
              <TokenImage token={ABREQ[chainId]} chainId={chainId} width={20} height={20} />
            </Flex>
          </Flex>

          <Flex flexDirection="row" width='100%' justifyContent='center' alignItems='center'>
            {reqPrice && reqPrice > 0 && (
              <>
                <Text fontSize='10px' marginTop='2px' textAlign='center' marginRight='10px'>
                  {thisBond.bondPrice > 0 ? `~$${(Math.round(payout * reqPrice / thisBond.bondPrice * 100) / 100).toLocaleString()}` : ''}
                </Text>
                <Text fontSize='10px' marginTop='2px' textAlign='center' color='green'>
                  {thisBond.bondPrice > 0 ? `+ $${(Math.round((payout * reqPrice / thisBond.bondPrice - inputUSD) * 100) / 100).toLocaleString()}` : ''}
                </Text>
              </>
            )}
          </Flex>

          {/* <Flex flexDirection="row" width='100%' justifyContent='center' alignItems='center'>
            <Text marginRight='3px' bold>
              {`$${Math.round(payout * reqPrice / thisBond.bondPrice * 100) / 100} in`}
            </Text>
            <TokenImage token={ABREQ[chainId]} chainId={chainId} width={20} height={20} />
          </Flex> */}
          <Text fontSize='13px' marginLeft='5px' textAlign='center'>
            {thisBond?.vestingTerm ? `with ${prettifySeconds(thisBond.vestingTerm)} vesting` : ''}
          </Text>
        </Flex>
      </InputContainer >
    )
  }

  if (indexes.length === 0) {
    return (
      <Button
        width={isMobile ? '45%' : isApproved ? "40%" : "80%"}
        onClick={handleRedemption}
        variant="secondary"
        disabled
        style={{ borderTopLeftRadius: `${isApproved ? '3px' : '16px'}`, borderBottomLeftRadius: `${isApproved ? '3px' : '16px'}`, marginLeft: '5px', marginRight: '3px', borderBottomRightRadius: '16px', borderTopRightRadius: '16px' }}
      >
        <Text fontSize='15px' >
          {hasPosition ? 'None Matured' : 'No Positions'}
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
