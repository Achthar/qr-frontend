import React, { lazy, useCallback } from 'react'
import config from 'components/Menu/config'
import { Router, Redirect, Route, Switch, useHistory } from 'react-router-dom'
import { ButtonMenu, ButtonMenuItem, ResetCSS } from '@requiemswap/uikit'
import BigNumber from 'bignumber.js'
import { useTranslation } from 'contexts/Localization'
import useEagerConnect from 'hooks/useEagerConnect'
import { usePollBlockNumber } from 'state/block/hooks'
import { useFetchProfile } from 'state/profile/hooks'
import { DatePickerPortal } from 'components/DatePicker'
import Web3ReactManager from 'components/Web3ReactManager'
import Popups from 'components/Popups'
import SuspenseWithChunkError from './components/SuspenseWithChunkError'
import { ToastListener } from './contexts/ToastsContext'
import PageLoader from './components/Loader/PageLoader'

import history from './routerHistory'
// Views included in the main bundle
// import Swap from './views/Swap' // weighted + stable
import SwapV3 from './views/SwapV3' // uniswapv2 + stable


import {
  RedirectDuplicateTokenIds,
  RedirectToAddLiquidity,
} from './views/AddLiquidity/redirects'

import CustomMenu from './CustomNav'
import CustomNav from './CustomMenu'
import Balances from './Balances'
import GlobalStyle from './style/Global'

// Route-based code splitting
// Only pool is included in the main bundle because of it's the most visited page
const Home = lazy(() => import('./views/Home'))
// const Balances = lazy(() => import('./views/Balances'))
const Bonds = lazy(() => import('./views/Bonds'))
const NotFound = lazy(() => import('./views/NotFound'))
const AddLiquidity = lazy(() => import('./views/AddLiquidity'))
const AddStableLiquidity = lazy(() => import('./views/AddStableLiquidity'))
const Liquidity = lazy(() => import('./views/Pool/poolList'))
const LiquidityV2 = lazy(() => import('./views/Pool'))
const PoolFinder = lazy(() => import('./views/PoolFinder'))
const WeightedPairFinder = lazy(() => import('./views/PoolFinder/weightedPairFinder'))
const RemoveLiquidity = lazy(() => import('./views/RemoveLiquidity'))
const RemoveStableLiquidity = lazy(() => import('./views/RemoveStableLiquidity'))

// This config is required for number formatting
BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

const App: React.FC = () => {
  usePollBlockNumber()
  useEagerConnect()
  useFetchProfile()

  return (
    <Router history={history}>
      <ResetCSS />
      <GlobalStyle />
      {/* <CustomMenu /> */}
      <video id="background-video" autoPlay loop muted poster="https://requiem-finance.s3.eu-west-2.amazonaws.com/background/fractalStatic.jpg">
        <source src="https://requiem-finance.s3.eu-west-2.amazonaws.com/background/fractal2.0.mp4" type="video/mp4" />
      </video>
      <SuspenseWithChunkError fallback={<PageLoader />}>
        <Popups />
        {/* <Web3ReactManager> */}

        <Switch>
          <Route path="/" exact>
            <Home />
          </Route>
          <Route path="/bonds">
            <Bonds />
          </Route>
          {/* Using this format because these components use routes injected props. We need to rework them with hooks */}
          <Route exact strict path="/exchange" component={SwapV3} />
          <Route exact strict path="/findV2" component={PoolFinder} />
          <Route exact strict path="/find" component={WeightedPairFinder} />
          <Route exact strict path="/liquidity" component={Liquidity} />
          <Route exact strict path="/liquidityV2" component={LiquidityV2} />
          <Route exact strict path="/create" component={RedirectToAddLiquidity} />
          <Route exact path="/add" component={AddLiquidity} />
          <Route exact path="/add/stable" component={AddStableLiquidity} />
          <Route exact path="/add/:weightA-:currencyIdA/:weightB-:currencyIdB/:fee" component={RedirectDuplicateTokenIds} />
          <Route exact path="/create" component={AddLiquidity} />
          <Route exact path="/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
          {/* <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} /> */}
          <Route exact strict path="/remove/:weightA-:currencyIdA/:weightB-:currencyIdB/:fee" component={RemoveLiquidity} />
          <Route exact path="/remove/stables" component={RemoveStableLiquidity} />
          {/* Redirect */}
          <Route path="/pool">
            <Redirect to="/liquidity" />
          </Route>

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
        <Balances />
        {/* </Web3ReactManager> */}
        <CustomNav />
      </SuspenseWithChunkError>
      <ToastListener />
      <DatePickerPortal />
    </Router>
  )
}

export default React.memo(App)
