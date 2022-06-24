import BigNumber from 'bignumber.js'
import { ChainId, PoolType, Token } from '@requiemswap/sdk'
import { ethers } from 'ethers'
import { JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";

export type TranslatableText =
  | string
  | {
    key: string
    data?: {
      [key: string]: string | number
    }
  }
// export type SerializedBigNumber = string

export const enum ChainGroup {
  BSC = 'BSC',
  ETH = 'ETH',
  MATIC = 'MATIC',
  AVAX = 'AVAX'
}

export interface TokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: {
    readonly [key: string]: string | number | boolean | null;
  };
}

export interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface Tags {
  readonly [tagId: string]: {
    readonly name: string;
    readonly description: string;
  };
}

export interface TokenList {
  readonly name: string;
  readonly timestamp: string;
  readonly version: Version;
  readonly tokens: TokenInfo[];
  readonly keywords?: string[];
  readonly tags?: Tags;
  readonly logoURI?: string;
}

export interface TokenPair {
  token0: SerializedToken
  token1: SerializedToken
}

export interface Address {
  97?: string
  56?: string
  137?: string
  80001?: string
  43114?: string
  42261?: string
  43113?: string
  110001?: string
}

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
  projectLink?: string
}

export enum PoolIds {
  poolBasic = 'poolBasic',
  poolUnlimited = 'poolUnlimited',
}

export type IfoStatus = 'idle' | 'coming_soon' | 'live' | 'finished'

interface IfoPoolInfo {
  saleAmount: string
  raiseAmount: string
  cakeToBurn: string
  distributionRatio: number // Range [0-1]
}

export interface Ifo {
  id: string
  isActive: boolean
  address: string
  name: string
  currency: SerializedToken
  token: SerializedToken
  releaseBlockNumber: number
  articleUrl: string
  campaignId: string
  tokenOfferingPrice: number
  version: number
  [PoolIds.poolBasic]?: IfoPoolInfo
  [PoolIds.poolUnlimited]: IfoPoolInfo
}

export enum PoolCategory {
  'COMMUNITY' = 'Community',
  'CORE' = 'Core',
  'BINANCE' = 'Binance', // Pools using native BNB behave differently than pools using a token
  'AUTO' = 'Auto',
}

export interface FarmConfig {
  pid: number
  lpSymbol: string
  lpAddresses: Address
  lpData?: {
    type: PoolType
    weight?: number
    fee?: number
  }
  token: Token
  quoteToken: Token
  multiplier?: string
  isCommunity?: boolean
  dual?: {
    rewardPerBlock: number
    earnLabel: string
    endBlock: number
  }
}


// farm interface

interface FarmConfigBaseProps {
  pid: number
  lpSymbol: string
  quoteTokenIndex: number
  lpAddresses: Address
  poolAddress: string,
  lpData?: {
    weight?: number
    fee?: number
    pricerKey?: string[]
  }
  multiplier?: string
  isCommunity?: boolean
  dual?: {
    rewardPerBlock: number
    earnLabel: string
    endBlock: number
  }
}

export enum PoolClass {
  PAIR,
  STABLE,
  WEIGHTED
}

export interface SerializedFarmConfig extends FarmConfigBaseProps {
  poolAddress: string
  poolClass: PoolClass
  tokens: SerializedToken[]
  weights: number[]
  lockMaturity: number
  lpProperties?: {
    weightToken: number
    weightQuoteToken: number
    fee: number
  }
}

export interface DeserializedFarmConfig extends FarmConfigBaseProps {
  poolClass?: PoolClass
  tokens: Token[]
}

// ------- bond interfaces 

interface BondOpts {
  bondId: string
  name: string; // Internal name used for references
  displayName: string; // Displayname on UI
  isBondable: Available; // aka isBondable => set false to hide
  isClaimable: Available; // set false to hide
  bondIconSvg: React.ReactNode; //  SVG path for icons
  bondContractABI: ethers.ContractInterface; // ABI for contract
  reserveAddress: Address;
  bondAddress: Address;
  bondToken: string; // Unused, but native token to buy the bond.
  payoutToken: string; // Token the user will receive - currently OHM on ethereum, wsOHM on arbitrum
}

// Asset type to be bonded
export enum BondAssetType {
  StableAsset,
  PairLP,
  StableSwapLP,
  WeightedPoolLP,
  RequiemLP
}

// Bond Depo Structure type
export enum BondType {
  Vanilla,
  Call,
  Digital
}

export interface Available {
  [ChainId.AVAX_MAINNET]: boolean;
  [ChainId.AVAX_TESTNET]: boolean;
}

export interface BondConfig {
  bondId?: number;
  name: string;
  displayName: string;
  isBondable?: Available;
  isClaimable?: Available;
  // the following two will be assigned initially
  assetType?: BondAssetType;
  bondType?: BondType;
  
  reserveAddress?: Address;
  bondToken: string;
  payoutToken: string;
  // The following two fields will differ on how they are set depending on bond type
  // reserveContract: ethers.ContractInterface; // Token ABI
  displayUnits?: string;
  tokens: SerializedToken[]
  quoteTokenIndex: number
  lpProperties?: {
    weightToken: number
    weightQuoteToken: number
    fee: number
  }
}


// Keep all LP specific fields/logic within the LPBond class
export interface LPBondOpts extends BondOpts {
  reserveContract: ethers.ContractInterface;
  lpUrl: string;
}


export interface StableBondConfig extends BondConfig {
  // readonly isLP = false;
  reserveContract: ethers.ContractInterface;
  displayUnits: string;

}

export interface CustomBondConfig extends BondConfig {
  isLP: boolean;
  reserveContract: ethers.ContractInterface;
  displayUnits: string;
  lpUrl: string;
}

// These are special bonds that have different valuation methods
export interface CustomBondOpts extends BondOpts {
  reserveContract: ethers.ContractInterface;
  bondType: number;
  lpUrl: string;
  customTreasuryBalanceFunc: (
    this: CustomBondConfig,
    chainId: number,
    provider: StaticJsonRpcProvider,
  ) => Promise<number>;
}


export type Images = {
  lg: string
  md: string
  sm: string
  ipfs?: string
}

export type NftImages = {
  blur?: string
} & Images

export type NftVideo = {
  webm: string
  mp4: string
}

export enum NftType {
  PANCAKE = 'pancake',
  MIXIE = 'mixie',
}

export type Nft = {
  description: string
  name: string
  images: NftImages
  sortOrder: number
  type: NftType
  video?: NftVideo

  // Uniquely identifies the nft.
  // Used for matching an NFT from the config with the data from the NFT's tokenURI
  identifier: string

  // Used to be "bunnyId". Used when minting NFT
  variationId?: number | string
}

export type TeamImages = {
  alt: string
} & Images

export type Team = {
  id: number
  name: string
  description: string
  isJoinable?: boolean
  users: number
  points: number
  images: TeamImages
  background: string
  textColor: string
}

export type CampaignType = 'ifo' | 'teambattle' | 'participation'

export type Campaign = {
  id: string
  type: CampaignType
  title?: TranslatableText
  description?: TranslatableText
  badge?: string
}

export type PageMeta = {
  title: string
  description?: string
  image?: string
}

export enum LotteryStatus {
  PENDING = 'pending',
  OPEN = 'open',
  CLOSE = 'close',
  CLAIMABLE = 'claimable',
}

export interface LotteryTicket {
  id: string
  number: string
  status: boolean
  rewardBracket?: number
  roundId?: string
  cakeReward?: string // SerializedBigNumber
}

export interface LotteryTicketClaimData {
  ticketsWithUnclaimedRewards: LotteryTicket[]
  allWinningTickets: LotteryTicket[]
  cakeTotal: BigNumber
  roundId: string
}

// Farm Auction
export interface FarmAuctionBidderConfig {
  account: string
  farmName: string
  tokenAddress: string
  quoteToken: SerializedToken
  tokenName: string
  projectSite?: string
  lpAddress?: string
}

// Note: this status is slightly different compared to 'status' comfing
// from Farm Auction smart contract
export enum AuctionStatus {
  ToBeAnnounced, // No specific dates/blocks to display
  Pending, // Auction is scheduled but not live yet (i.e. waiting for startBlock)
  Open, // Auction is open for bids
  Finished, // Auction end block is reached, bidding is not possible
  Closed, // Auction was closed in smart contract
}

export interface Auction {
  id: number
  status: AuctionStatus
  startBlock: number
  startDate: Date
  endBlock: number
  endDate: Date
  auctionDuration: number
  farmStartBlock: number
  farmStartDate: Date
  farmEndBlock: number
  farmEndDate: Date
  initialBidAmount: number
  topLeaderboard: number
  leaderboardThreshold: BigNumber
}

export interface BidderAuction {
  id: number
  amount: BigNumber
  claimed: boolean
}

export interface Bidder extends FarmAuctionBidderConfig {
  position?: number
  isTopPosition: boolean
  samePositionAsAbove: boolean
  amount: BigNumber
}

export interface ConnectedBidder {
  account: string
  isWhitelisted: boolean
  bidderData?: Bidder
}