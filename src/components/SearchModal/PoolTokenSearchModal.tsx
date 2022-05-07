import React, { useCallback, useState } from 'react'
import { Currency, Pool, Token } from '@requiemswap/sdk'
import {
  ModalContainer,
  ModalHeader,
  ModalTitle,
  ModalBackButton,
  ModalCloseButton,
  ModalBody,
  InjectedModalProps,
  Heading,
  Button,
} from '@requiemswap/uikit'
import styled from 'styled-components'
import usePrevious from 'hooks/usePreviousValue'
import { TokenList } from '@uniswap/token-lists'
import { useTranslation } from 'contexts/Localization'
import StableSearch from './StableSearch'
import TokenSearch from './TokenSearch'
import ImportToken from './ImportToken'
import Manage from './Manage'
import ImportList from './ImportList'
import { CurrencyModalView } from './types'

const Footer = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  text-align: center;
`

const StyledModalContainer = styled(ModalContainer)`
  max-width: 420px;
  width: 100%;
  z-index:999;

`

const StyledModalBody = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  padding: 24px;
`

interface CurrencySearchModalProps extends InjectedModalProps {
  account: string
  pool: Pool
  selectedCurrency?: Token | null
  onCurrencySelect: (currency: Token) => void
  otherSelectedCurrency?: Token | null
}

export default function PoolTokenSearchModal({
  account,
  pool,
  onDismiss = () => null,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.search)

  const handleCurrencySelect = useCallback(
    (currency: Token) => {
      onDismiss()
      onCurrencySelect(currency)
    },
    [onDismiss, onCurrencySelect],
  )

  // used for import token flow
  const [importToken, setImportToken] = useState<Token | undefined>()

  // for token import view
  const prevView = usePrevious(modalView)

  const { t } = useTranslation()

  const config = {
    [CurrencyModalView.search]: { title: `Select a Single ${pool.name} Token to Receive`, onBack: undefined },
    [CurrencyModalView.manage]: { title: t('Manage'), onBack: () => setModalView(CurrencyModalView.search) },
    [CurrencyModalView.importToken]: {
      title: t('Import Tokens'),
      onBack: () =>
        setModalView(prevView && prevView !== CurrencyModalView.importToken ? prevView : CurrencyModalView.search),
    }
  }

  return (
    <StyledModalContainer minWidth="320px">
      <ModalHeader>
        <ModalTitle>
          {config[modalView].onBack && <ModalBackButton onBack={config[modalView].onBack} />}
          <Heading>{config[modalView].title}</Heading>
        </ModalTitle>
        <ModalCloseButton onDismiss={onDismiss} />
      </ModalHeader>
      <StyledModalBody>
        <TokenSearch
          account={account}
          tokens={pool.tokens}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          showImportView={() => setModalView(CurrencyModalView.importToken)}
          setImportToken={setImportToken}
        />


        {/* {modalView === CurrencyModalView.search && (
          <Footer>
            <Button
              scale="sm"
              variant="text"
              onClick={() => setModalView(CurrencyModalView.manage)}
              className="list-token-manage-button"
            >
              {t('Manage Tokens')}
            </Button>
          </Footer>
        )} */}
      </StyledModalBody>
    </StyledModalContainer>
  )
}
