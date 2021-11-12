import { createStore, Store } from 'redux'

import { setChainId } from './actions'
import reducer, { GlobalNetworkState } from './reducer'

describe('mint reducer', () => {
  let store: Store<GlobalNetworkState>

  beforeEach(() => {
    store = createStore(reducer, {
      chainId: 10
    })
  })

  describe('setChainId', () => {
    it('sets chainId', () => {
      store.dispatch(setChainId({ chainId: 20 }))
      expect(store.getState()).toEqual({ chainId: 20 })
    })
  })
})
