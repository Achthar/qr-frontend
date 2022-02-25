/* eslint default-case: 0 */
/* eslint no-useless-return: 0 */
import styled from "styled-components";
import React, { useState } from 'react'

import { useDispatch } from 'react-redux'
import { Button, Box, CurrencyIcon } from '@requiemswap/uikit'
import { useWeb3React } from "@web3-react/core";
import { AppDispatch } from 'state'
import { useGlobalNetworkActionHandlers, useNetworkState } from "state/globalNetwork/hooks";

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
  const { account } = useWeb3React()
  const [balanceShown, showBalance] = useState<boolean>(false)
  const handleClick = () => showBalance(!balanceShown)
  return (
    <AppFooterContainer>
      <div style={{ zIndex: 15 }}>
        <StyledButton
          marginBottom={balanceShown && account ? '160px' : '0px'}
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
