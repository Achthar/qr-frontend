import { ThunkAction } from 'redux-thunk'
import { AnyAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import {
  CampaignType,
  FarmConfig,
  LotteryStatus,
  LotteryTicket,
  Nft,
  Team,
  // SerializedBigNumber,
  TranslatableText,
  BondConfig,
  SerializedFarmConfig,
  DeserializedFarmConfig,
  SerializedToken,
  TokenPair
} from 'config/constants/types'

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, State, unknown, AnyAction>

export interface BigNumberToJson {
  type: 'BigNumber'
  hex: string
}

export type SerializedBigNumber = string

export interface Pool extends PoolConfig {
  totalStaked?: BigNumber
  stakingLimit?: BigNumber
  startBlock?: number
  endBlock?: number
  apr?: number
  stakingTokenPrice?: number
  earningTokenPrice?: number
  isAutoVault?: boolean
  userData?: {
    allowance: BigNumber
    stakingTokenBalance: BigNumber
    stakedBalance: BigNumber
    pendingReward: BigNumber
  }
}

export interface Profile {
  userId: number
  points: number
  teamId: number
  nftAddress: string
  tokenId: number
  isActive: boolean
  username: string
  nft?: Nft
  team: Team
  hasRegistered: boolean
}

// Slices states

export interface Farm extends FarmConfig {
  tokenAmountMc?: SerializedBigNumber
  quoteTokenAmountMc?: SerializedBigNumber
  tokenAmountTotal?: SerializedBigNumber
  quoteTokenAmountTotal?: SerializedBigNumber
  lpTotalInQuoteToken?: SerializedBigNumber
  lpTotalSupply?: SerializedBigNumber
  tokenPriceVsQuote?: SerializedBigNumber
  poolWeight?: SerializedBigNumber
  userData?: {
    allowance: string
    tokenBalance: string
    stakedBalance: string
    earnings: string
  }
}

export interface IBondDetails {
  bondDiscount?: number;
  debtRatio?: SerializedBigNumber;
  bondQuote?: number;
  purchased?: number;
  vestingTerm?: number;
  maxBondPrice?: number;
  bondPrice?: number;
  marketPrice?: SerializedBigNumber;
}

export interface Note {
  payout: SerializedBigNumber;
  created: number;
  matured: number;
  redeemed: SerializedBigNumber;
  marketId: number;
  noteIndex: number;
}

export interface Bond extends BondConfig, IBondDetails {
  tokenAmount?: SerializedBigNumber
  quoteTokenAmountMc?: SerializedBigNumber
  tokenAmountTotal?: SerializedBigNumber
  quoteTokenAmountTotal?: SerializedBigNumber
  lpTotalInQuoteToken?: SerializedBigNumber
  lpTotalSupply?: SerializedBigNumber
  tokenPriceVsQuote?: SerializedBigNumber
  poolWeight?: SerializedBigNumber,
  price?: SerializedBigNumber,
  userData?: {
    allowance: string
    tokenBalance: string
    stakedBalance: string
    earnings: string
    pendingPayout: string
    interestDue: string
    balance: string
    bondMaturationBlock: number
    notes: Note[]
  },
  lpData?: {
    lpTotalSupply: SerializedBigNumber
    reserve0: SerializedBigNumber
    reserve1: SerializedBigNumber
    priceInQuote: SerializedBigNumber
  },
  bondTerms?: {
    controlVariable: SerializedBigNumber; // scaling variable for price
    maxDebt: SerializedBigNumber;
    conclusion: SerializedBigNumber;
    vesting: SerializedBigNumber;
    fixedTerm: boolean;
  }
  market?: {
    capacity: SerializedBigNumber;
    capacityInQuote: boolean;
    totalDebt: SerializedBigNumber;
    maxPayout: SerializedBigNumber;
    sold: SerializedBigNumber;
    purchased: SerializedBigNumber;
  }
  // bondId?: number
  bond?: string
  // displayName?: string
  // isLP?: boolean
  allowance?: number
  balance?: string
  interestDue?: number
  bondMaturationBlock?: number
}

export interface BondsState {
  loadArchivedBondsData: boolean
  userDataLoaded: boolean
  status?: string
  bondData: {
    [bondId: number]: Bond
  }
}


// stable pool interfaces
export interface PoolConfig {
  key: string
  address: string
  lpAddress: string
  tokens: SerializedToken[]
}

export interface StableSwapStorage {
  tokenMultipliers: SerializedBigNumber[]
  fee: SerializedBigNumber
  adminFee: SerializedBigNumber
  initialA: SerializedBigNumber
  futureA: SerializedBigNumber
  initialATime: SerializedBigNumber
  futureATime: SerializedBigNumber
  lpAddress: string
  defaultWithdrawFee: SerializedBigNumber
}

export interface SerializedStablePool extends PoolConfig {
  balances: SerializedBigNumber[]
  A: SerializedBigNumber
  swapStorage: StableSwapStorage
  lpToken: SerializedToken
  lpTotalSupply: SerializedBigNumber
  userData?: {
    allowances: SerializedBigNumber[]
    lpAllowance: SerializedBigNumber
    lpBalance: SerializedBigNumber
    userWithdarawFee: SerializedBigNumber
  }
}

export interface StablePoolData {
  pools: SerializedStablePool[]
  publicDataLoaded: boolean
  userDataLoaded: boolean
}

export interface StablePoolsState {
  referenceChain: number
  poolData: { [chainId: number]: StablePoolData }
}




export interface WeightedSwapStorage {
  tokenMultipliers: SerializedBigNumber[]
  fee: SerializedBigNumber
  adminFee: SerializedBigNumber
  initialA: SerializedBigNumber
  futureA: SerializedBigNumber
  initialATime: SerializedBigNumber
  futureATime: SerializedBigNumber
  lpAddress: string
  defaultWithdrawFee: SerializedBigNumber
}

export interface SerializedWeightedPool extends PoolConfig {
  balances: SerializedBigNumber[]
  A: SerializedBigNumber
  swapStorage: StableSwapStorage
  lpToken: SerializedToken
  lpTotalSupply: SerializedBigNumber
  userData?: {
    allowances: SerializedBigNumber[]
    lpAllowance: SerializedBigNumber
    lpBalance: SerializedBigNumber
    userWithdarawFee: SerializedBigNumber
  }
}

export interface WeightedPoolData {
  pools: SerializedWeightedPool[]
  publicDataLoaded: boolean
  userDataLoaded: boolean
}

export interface WeightedPoolsState {
  referenceChain: number
  poolData: { [chainId: number]: WeightedPoolData }
}


// weighted pair interfaes

export interface WeightedPairMetaData extends TokenPair {
  weight0: number
  fee: number
  amp: number
  address?: string
}

export interface SerializedWeightedPair extends WeightedPairMetaData {
  // data from chain
  reserve0?: SerializedBigNumber
  reserve1?: SerializedBigNumber
  vReserve0?: SerializedBigNumber
  vReserve1?: SerializedBigNumber
  balances?: SerializedBigNumber[]
  virtualBalances?: SerializedBigNumber[]
  totalSupply?: SerializedBigNumber
  // price as a ratio of reserve0 / reserve1
  price0?: number
  price1?: number
  value0?: number
  value1?: number
  userData?: {
    allowanceRouter?: SerializedBigNumber
    allowancePairManager?: SerializedBigNumber
    balance: SerializedBigNumber
  }
}


export interface WeightedPairState {
  currentChain: number
  [chainId: number]: {
    pairsPriced: boolean
    referenceChain: number,
    tokenPairs: TokenPair[]
    weightedPairMeta: {
      [pastedAddresses: string]: WeightedPairMetaData[]
    }
    weightedPairs: {
      [pastedAddresses: string]: {
        [weight0Fee: string]: SerializedWeightedPair
      }
    },
    metaDataLoaded: boolean
    reservesAndWeightsLoaded: boolean
    userBalancesLoaded: boolean
  }
}

export interface FarmsState {
  data: Farm[]
  loadArchivedFarmsData: boolean
  userDataLoaded: boolean
}

export interface VaultFees {
  performanceFee: number
  callFee: number
  withdrawalFee: number
  withdrawalFeePeriod: number
}

export interface VaultUser {
  isLoading: boolean
  userShares: string
  cakeAtLastUserAction: string
  lastDepositedTime: string
  lastUserActionTime: string
}
export interface CakeVault {
  totalShares?: string
  pricePerFullShare?: string
  totalCakeInVault?: string
  estimatedCakeBountyReward?: string
  totalPendingCakeHarvest?: string
  fees?: VaultFees
  userData?: VaultUser
}

export interface PoolsState {
  data: Pool[]
  cakeVault: CakeVault
  userDataLoaded: boolean
}

export interface ProfileState {
  isInitialized: boolean
  isLoading: boolean
  hasRegistered: boolean
  data: Profile
}

export type TeamResponse = {
  0: string
  1: string
  2: string
  3: string
  4: boolean
}

export type TeamsById = {
  [key: string]: Team
}

export interface TeamsState {
  isInitialized: boolean
  isLoading: boolean
  data: TeamsById
}

export interface Achievement {
  id: string
  type: CampaignType
  address: string
  title: TranslatableText
  description?: TranslatableText
  badge: string
  points: number
}

export interface AchievementState {
  data: Achievement[]
}

// Block

export interface BlockState {
  currentBlock: number
  initialBlock: number
}

// Collectibles

export interface CollectiblesState {
  isInitialized: boolean
  isLoading: boolean
  data: {
    [key: string]: number[]
  }
}

// Predictions

export enum BetPosition {
  BULL = 'Bull',
  BEAR = 'Bear',
  HOUSE = 'House',
}

export enum PredictionStatus {
  INITIAL = 'initial',
  LIVE = 'live',
  PAUSED = 'paused',
  ERROR = 'error',
}

export interface Round {
  id: string
  epoch: number
  failed?: boolean
  startBlock: number
  startAt: number
  startHash: string
  lockAt: number
  lockBlock: number
  lockPrice: number
  lockHash: string
  lockRoundId: string
  closeRoundId: string
  closeHash: string
  closeAt: number
  closePrice: number
  closeBlock: number
  totalBets: number
  totalAmount: number
  bullBets: number
  bearBets: number
  bearAmount: number
  bullAmount: number
  position: BetPosition
  bets?: Bet[]
}

export interface Market {
  paused: boolean
  epoch: number
}

export interface Bet {
  id?: string
  hash?: string
  amount: number
  position: BetPosition
  claimed: boolean
  claimedAt: number
  claimedHash: string
  claimedBNB: number
  claimedNetBNB: number
  createdAt: number
  updatedAt: number
  block: number
  user?: PredictionUser
  round?: Round
}

export interface PredictionUser {
  id: string
  createdAt: number
  updatedAt: number
  block: number
  totalBets: number
  totalBetsBull: number
  totalBetsBear: number
  totalBNB: number
  totalBNBBull: number
  totalBNBBear: number
  totalBetsClaimed: number
  totalBNBClaimed: number
  winRate: number
  averageBNB: number
  netBNB: number
}

export interface HistoryData {
  [key: string]: Bet[]
}

export enum HistoryFilter {
  ALL = 'all',
  COLLECTED = 'collected',
  UNCOLLECTED = 'uncollected',
}

export interface LedgerData {
  [key: string]: {
    [key: string]: ReduxNodeLedger
  }
}

export interface RoundData {
  [key: string]: ReduxNodeRound
}

export interface ReduxNodeLedger {
  position: BetPosition
  amount: BigNumberToJson
  claimed: boolean
}

export interface NodeLedger {
  position: BetPosition
  amount: ethers.BigNumber
  claimed: boolean
}

export interface ReduxNodeRound {
  epoch: number
  startTimestamp: number | null
  lockTimestamp: number | null
  closeTimestamp: number | null
  lockPrice: BigNumberToJson | null
  closePrice: BigNumberToJson | null
  totalAmount: BigNumberToJson
  bullAmount: BigNumberToJson
  bearAmount: BigNumberToJson
  rewardBaseCalAmount: BigNumberToJson
  rewardAmount: BigNumberToJson
  oracleCalled: boolean
  lockOracleId: string
  closeOracleId: string
}

export interface NodeRound {
  epoch: number
  startTimestamp: number | null
  lockTimestamp: number | null
  closeTimestamp: number | null
  lockPrice: ethers.BigNumber | null
  closePrice: ethers.BigNumber | null
  totalAmount: ethers.BigNumber
  bullAmount: ethers.BigNumber
  bearAmount: ethers.BigNumber
  rewardBaseCalAmount: ethers.BigNumber
  rewardAmount: ethers.BigNumber
  oracleCalled: boolean
  closeOracleId: string
  lockOracleId: string
}

export interface PredictionsState {
  status: PredictionStatus
  isLoading: boolean
  isHistoryPaneOpen: boolean
  isChartPaneOpen: boolean
  isFetchingHistory: boolean
  historyFilter: HistoryFilter
  currentEpoch: number
  intervalSeconds: number
  minBetAmount: string
  bufferSeconds: number
  lastOraclePrice: string
  history: HistoryData
  rounds?: RoundData
  ledgers?: LedgerData
  claimableStatuses: {
    [key: string]: boolean
  }
}

// Voting

/* eslint-disable camelcase */
/**
 * @see https://hub.snapshot.page/graphql
 */
export interface VoteWhere {
  id?: string
  id_in?: string[]
  voter?: string
  voter_in?: string[]
  proposal?: string
  proposal_in?: string[]
}

export enum SnapshotCommand {
  PROPOSAL = 'proposal',
  VOTE = 'vote',
}

export enum ProposalType {
  ALL = 'all',
  CORE = 'core',
  COMMUNITY = 'community',
}

export enum ProposalState {
  ACTIVE = 'active',
  PENDING = 'pending',
  CLOSED = 'closed',
}

export interface Space {
  id: string
  name: string
}

export interface Proposal {
  author: string
  body: string
  choices: string[]
  end: number
  id: string
  snapshot: string
  space: Space
  start: number
  state: ProposalState
  title: string
}

export interface Vote {
  id: string
  voter: string
  created: number
  space: Space
  proposal: {
    choices: Proposal['choices']
  }
  choice: number
  metadata?: {
    votingPower: string
    verificationHash: string
  }
  _inValid?: boolean
}

export enum VotingStateLoadingStatus {
  INITIAL = 'initial',
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

export interface VotingState {
  proposalLoadingStatus: VotingStateLoadingStatus
  proposals: {
    [key: string]: Proposal
  }
  voteLoadingStatus: VotingStateLoadingStatus
  votes: {
    [key: string]: Vote[]
  }
}

export interface LotteryRoundUserTickets {
  isLoading?: boolean
  tickets?: LotteryTicket[]
}

interface LotteryRoundGenerics {
  isLoading?: boolean
  lotteryId: string
  status: LotteryStatus
  startTime: string
  endTime: string
  treasuryFee: string
  firstTicketId: string
  lastTicketId: string
  finalNumber: number
}

export interface LotteryRound extends LotteryRoundGenerics {
  userTickets?: LotteryRoundUserTickets
  priceTicketInCake: BigNumber
  discountDivisor: BigNumber
  amountCollectedInCake: BigNumber
  cakePerBracket: string[]
  countWinnersPerBracket: string[]
  rewardsBreakdown: string[]
}

export interface LotteryResponse extends LotteryRoundGenerics {
  priceTicketInCake: SerializedBigNumber
  discountDivisor: SerializedBigNumber
  amountCollectedInCake: SerializedBigNumber
  cakePerBracket: SerializedBigNumber[]
  countWinnersPerBracket: SerializedBigNumber[]
  rewardsBreakdown: SerializedBigNumber[]
}

export interface LotteryState {
  currentLotteryId: string
  maxNumberTicketsPerBuyOrClaim: string
  isTransitioning: boolean
  currentRound: LotteryResponse & { userTickets?: LotteryRoundUserTickets }
  lotteriesData?: LotteryRoundGraphEntity[]
  userLotteryData?: LotteryUserGraphEntity
}

export interface LotteryRoundGraphEntity {
  id: string
  totalUsers: string
  totalTickets: string
  winningTickets: string
  status: LotteryStatus
  finalNumber: string
  startTime: string
  endTime: string
  ticketPrice: SerializedBigNumber
}

export interface LotteryUserGraphEntity {
  account: string
  totalCake: string
  totalTickets: string
  rounds: UserRound[]
}

export interface UserRound {
  claimed: boolean
  lotteryId: string
  status: LotteryStatus
  endTime: string
  totalTickets: string
  tickets?: LotteryTicket[]
}

export type UserTicketsResponse = [ethers.BigNumber[], number[], boolean[]]

interface SerializedFarmUserData {
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
}

export interface DeserializedFarmUserData {
  allowance: BigNumber
  tokenBalance: BigNumber
  stakedBalance: BigNumber
  earnings: BigNumber
}

export interface DeserializedFarmsState {
  data: DeserializedFarm[]
  loadArchivedFarmsData: boolean
  userDataLoaded: boolean
}

export interface SerializedFarm extends SerializedFarmConfig {
  tokenPriceBusd?: string
  quoteTokenPriceBusd?: string
  tokenAmountTotal?: SerializedBigNumber
  lpTotalInQuoteToken?: SerializedBigNumber
  lpTotalSupply?: SerializedBigNumber
  tokenPriceVsQuote?: SerializedBigNumber
  poolWeight?: SerializedBigNumber
  lpTokenRatio?: SerializedBigNumber
  userData?: SerializedFarmUserData
}

export interface DeserializedFarm extends DeserializedFarmConfig {
  tokenPriceBusd?: string
  quoteTokenPriceBusd?: string
  tokenAmountTotal?: BigNumber
  lpTotalInQuoteToken?: BigNumber
  lpTotalSupply?: BigNumber
  tokenPriceVsQuote?: BigNumber
  poolWeight?: BigNumber
  userData?: DeserializedFarmUserData
  lpTokenRatio?: number
}


export interface SerializedFarmsState {
  data: SerializedFarm[]
  loadArchivedFarmsData: boolean
  userDataLoaded: boolean
}

// Global state

export interface State {
  achievements: AchievementState
  block: BlockState
  bonds: BondsState
  farms: SerializedFarmsState
  // pools: PoolsState
  weightedPairs: WeightedPairState
  stablePools: StablePoolsState
  weightedPools: WeightedPoolsState
  predictions: PredictionsState
  profile: ProfileState
  teams: TeamsState
  collectibles: CollectiblesState
  voting: VotingState
  lottery: LotteryState
}