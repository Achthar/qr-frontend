/* eslint default-case: 0 */
import styled from "styled-components";
import React, { HTMLProps, useCallback, useRef, useState } from 'react'
import {
  CHAIN_INFO,
  L2_CHAIN_IDS,
  SupportedL2ChainId,
} from 'config/constants/index'
import { useDispatch } from 'react-redux'
import { ChainId } from '@requiemswap/sdk'
import { ArrowDownCircle, ChevronDown } from 'react-feather'
import { switchToNetwork } from 'utils/switchToNetwork'
import { UserMenu as UIKitUserMenu, useMatchBreakpoints, Button, UserMenuItem, Flex, Text, Box, CurrencyIcon } from '@requiemswap/uikit'
import { useWeb3React } from "@web3-react/core";
import { AppDispatch } from 'state'
import { useGlobalNetworkActionHandlers, useNetworkState } from "state/globalNetwork/hooks";
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import UserBalances from 'views/Balances'

const Row = styled(Box) <{
  width?: string
  align?: string
  justify?: string
  padding?: string
  border?: string
  borderRadius?: string
}>`
  width: ${({ width }) => width ?? '100%'};
  display: flex;
  padding: 0;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'flex-start'};
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`

export const RowBetween = styled(Row)`
  justify-content: space-between;
`

export const Wrapper = styled.div`
  position: relative;
`;

const SelectorWrapper = styled.div`
  @media screen and (min-width: 720px) {
    position: relative;
  }
`

export const ActivatorButton = styled.button`
  height: 33px;
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 12px;
  padding:  6px 8px;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.4rem;
  margin-right: 0.4rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  justify-content: space-between;
  align-items: center;
  float: right;

  :hover {
    background-color: ${({ theme }) => theme.colors.dropdown};
  }
  :focus {
    background-color: ${({ theme }) => theme.colors.dropdown};
    outline: none;
  }
`

const Logo = styled.img`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`;
const FlyoutRow = styled.div<{ active: boolean }>`
  align-items: center;
  background-color: ${({ active, theme }) => (active ? theme.colors.contrast : 'transparent')};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
  text-align: left;
  width: 100%;
`;
const NetworkLabel = styled.div`
  flex: 1 1 auto;
  color: #c7c7c7;
`;

const FlyoutRowActiveIndicator = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 50%;
  height: 9px;
  width: 9px;
`;

const StyledLink = styled.a`
  text-decoration: none;
  cursor: pointer;
  color: #c7c7c7;
  font-weight: 500;

  :hover {
    text-decoration: underline;
  }

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }
`;
const ActiveRowWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 8px;
  cursor: pointer;
  padding: 8px 0 8px 0;
  width: 100%;
`;

const ActiveRowLinkList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  & > a {
    align-items: center;
    color: ${({ theme }) => theme.colors.textSubtle};
    display: flex;
    flex-direction: row;
    font-size: 14px;
    font-weight: 500;
    justify-content: space-between;
    padding: 8px 0 4px;
    text-decoration: none;
  }
  & > a:first-child {
    border-top: 1px solid ${({ theme }) => theme.colors.textSubtle};
    margin: 0;
    margin-top: 6px;
    padding-top: 10px;
  }
`;

const SelectorControls = styled.div<{ interactive: boolean }>`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text};
  cursor: ${({ interactive }) => (interactive ? 'pointer' : 'auto')};
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
`

const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 16px;
  height: 16px;
`;



const AppFooterContainer = styled.div`
  z-index: 15;
  bottom: 0;
  position: fixed;
  align: center;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 70;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`
const BalanceContainer = styled.div<{ balanceShown: boolean }>`
  z-index: 14;
  bottom: ${({ balanceShown }) => (balanceShown ? '0' : '-100')};
  position: fixed;
  align: center;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 70;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const StyledButton = styled(Button) <{ mB: string, width: string }>`
  background-color:none;
  color: none;
  box-shadow: none;
  border-radius: 20px;
  width: ${({ width }) => width};
  align: right;
  marginBottom: ${({ mB }) => mB};
`

const Balances = () => {
  // global network chainId
  const { onChainChange, onAccountChange } = useGlobalNetworkActionHandlers()
  const{ chainId: chainIdState} = useNetworkState()
  const { chainId, library, account } = useWeb3React()
  // const dispatch = useDispatch<AppDispatch>()
  // if(chainIdState !== chainId){
  //  onChainChange(chainId)
  // }
  const [balanceShown, showBalance] = useState<boolean>(false)
  const handleClick = () => showBalance(!balanceShown)
  return (
    <AppFooterContainer>
      <div style={{ zIndex: 15 }}>
        <StyledButton
          marginBottom={balanceShown && account ? '80px' : '0px'}
          width='0px'
          height='0px'
          endIcon={<CurrencyIcon width='30px' />}
          onClick={
            handleClick
          }
        />
        {/* <Text fontSize='15px'>
            Balances
          </Text>
        </StyledButton> */}
      </div>
      <RowBetween align='left'>
        <BalanceContainer balanceShown={balanceShown}>
          {UserBalances()}
        </BalanceContainer>
      </RowBetween>
    </AppFooterContainer>
  );
};

export default Balances
