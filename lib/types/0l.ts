import { getTransactionMin as getTransactionMinJS } from '../node_utils'

export interface Amount {
  amount: number
  currency: string
}

export interface Account {
  address: string
  balances: Amount[]
  sequence_number: number
  authentication_key: string
  sent_events_key: string
  received_events_key: string
  delegated_key_rotation_capability: boolean
  delegated_withdrawal_capability: boolean
  is_frozen: boolean
  role: {
    type: string
  }
  version: number
}

export interface NodeRPCError {
  code: number
  message: string
  data: any
}

export interface NodeRPCResponse {
  id: number
  jsonrpc: '2.0'
  diem_chain_id: number
  diem_ledger_timestampusec: number
  diem_ledger_version: number
  error?: NodeRPCError
}

export interface AccountResponse extends NodeRPCResponse {
  result: Account
}

export interface Script {
  type: string
  code: string
  arguments_bcs: string[]
  type_arguments: string[]
}

export interface TransactionData {
  type: string
}

export interface BlockMetadataTransaction extends TransactionData {
  type: 'blockmetadata'
  timestamp_usecs: number
}

export interface WriteSetTransaction extends TransactionData {
  type: 'writeset'
}

export interface UserTransaction extends TransactionData {
  type: 'user'
  sender: string
  signature_scheme: string
  signature: string
  public_key: string
  sequence_number: number
  chain_id: number
  max_gas_amount: number
  gas_unit_price: number
  gas_currency: string
  expiration_timestamp_secs: number
  script_hash: string
  script_bytes: string
  script: Script
}

export interface UnknownTransaction extends TransactionData {
  type: 'unknown'
}

export interface PeerToPeerWithMetadata extends Script {
  type: 'peer_to_peer_with_metadata'
  receiver: string
  amount: number
  currency: string
  metadata: string
  metadata_signature: string
}

export interface EventData {
  type: string
  amount: Amount
  sender?: string
  receiver?: string
  metadata?: string
  preburn_address?: string
}

export interface Event {
  key: string
  sequence_number: number
  transaction_version: number
  data: EventData
}

export interface EventsResponse extends NodeRPCResponse {
  result: Event[]
}

export interface VMStatus {
  type: string
}

export interface VMStatusExecuted extends VMStatus {
  type: 'executed'
}

export interface VMStatusOutOfGas extends VMStatus {
  type: 'out_of_gas'
}

export interface MoveAbortExplanation {
  category: string
  category_description: string
  reason: string
  reason_description: string
}

export interface VMStatusMoveAbort extends VMStatus {
  type: 'move_abort'
  location: string
  abort_code: number
  explanation: MoveAbortExplanation
}

export interface VMStatusExecutionFailure extends VMStatus {
  type: 'execution_failure'
  location: string
  function_index: number
  code_offset: number
}

export interface VMStatusMiscellaneousError extends VMStatus {
  type: 'miscellaneous_error'
}

export interface Transaction {
  version: number
  transaction:
    | BlockMetadataTransaction
    | WriteSetTransaction
    | UserTransaction
    | UnknownTransaction
  hash: string
  bytes: string
  events: Event[]
  vm_status:
    | VMStatusExecuted
    | VMStatusOutOfGas
    | VMStatusMoveAbort
    | VMStatusExecutionFailure
    | VMStatusMiscellaneousError
  gas_used: number
}

export interface TransactionsResponse extends NodeRPCResponse {
  result: Transaction[]
}

export interface TransactionResponse extends NodeRPCResponse {
  result: Transaction
}

export interface CurrencyInfo {
  code: string
  fractional_part: number
  scaling_factor: number
  to_xdx_exchange_rate: number
  mint_events_key: string
  burn_events_key: string
  preburn_events_key: string
  cancel_burn_events_key: string
  exchange_rate_update_events_key: string
}

export interface CurrenciesResponse extends NodeRPCResponse {
  result: CurrencyInfo[]
}

export interface Metadata {
  timestamp: number
  version: number
  chain_id: number
}

export interface MetadataResponse extends NodeRPCResponse {
  result: Metadata
}

export interface TowerState {
  previous_proof_hash: string
  verified_tower_height: number
  latest_epoch_mining: number
  count_proofs_in_epoch: number
  actual_count_proofs_in_epoch: number
  epochs_validating_and_mining: number
  contiguous_epochs_validating_and_mining: number
  epochs_since_last_account_creation: number
}

export interface TowerStateResponse extends NodeRPCResponse {
  result: TowerState
}

export interface TransactionMin {
  type: string
  hash: string
  version: number
  status?: string
  recipient?: string
  sender?: string
  amount?: number
  timestamp?: number
}

export const getTransactionMin = (tx: Transaction): TransactionMin => getTransactionMinJS(tx) as TransactionMin

export interface ValidatorInfo {
  account_address: string
  pub_key: string
  voting_power: number
  full_node_ip: string
  validator_ip: string
  tower_height: number
  tower_epoch: number
  count_proofs_in_epoch: number
  epochs_validating_and_mining: number
  contiguous_epochs_validating_and_mining: number
  epochs_since_last_account_creation: number
  vote_count_in_epoch: number
  prop_count_in_epoch: number
  validator_config: {
    operator_account: string
    operator_has_balance: boolean
  }
  autopay: {
    payments: {
      uid: number
      in_type: number
      type_desc: string
      payee: string
      end_epoch: number
      prev_balance: number
    }[]
    recurring_sum: number
  }
}

export interface AutoPayPayments {
  uid: number
  in_type: number
  type_desc: string
  payee: string
  end_epoch: number
  prev_balance: number
}
export interface Vitals {
  items: {
    configs_exist: boolean
    db_files_exist: boolean
    db_restored: boolean
    account_created: boolean
    node_running: boolean
    miner_running: boolean
    web_running: boolean
    node_mode: string
    is_synced: boolean
    sync_height: number
    sync_delay: number
    validator_set: boolean
    has_autopay: boolean
    has_operator_set: boolean
    has_operator_positive_balance: boolean
  }
  account_view: {
    address: string
    balance: number
    is_in_validator_set: boolean
    autopay: {
      payments: {
        uid: number
        in_type: number
        type_desc: string
        payee: string
        end_epoch: number
        prev_balance: number
      }[]
      recurring_sum: number
    }
    operator_account: string
    operator_balance: number
  }
  chain_view: {
    epoch: number
    height: number
    validator_count: number
    total_supply: number
    latest_epoch_change_time: number
    epoch_progress: number
    waypoint: string
    upgrade: {
      upgrade: {
        id: number
        validators_voted: any[]
        vote_counts: any[]
        votes: any[]
        vote_window: number
        version_id: number
        consensus: {
          data: any[]
          validators: any[]
          hash: any[]
          total_weight: number
        }
      }
    }
    validator_view: ValidatorInfo[]
  }
}

export interface StatsResponse {
  allAccountCount: number // All accounts
  allMinerCount: number // All accounts with tower height > 0
  activeMinerCount: number // All accounts that have submitted proofs in current epoch
}

export interface PermissionNodeValidator {
  address: string // Address of this validator
  operator_address: string // Operator account address
  parent: string // Address of validator that onboarded this validator
  version_onboarded: number // Height when validator was onboarded
  epoch_onboarded: number
  generation: number
}

export interface ValidatorPermissionTreeResponse
  extends PermissionNodeValidator {
  children: PermissionNodeValidator[]
}

export interface PermissionNodeMiner {
  address: string // Address of this validator
  parent: string // Address of validator that onboarded this validator
  version_onboarded: number // Height when validator was onboarded
  epoch_onboarded: number
  generation: number
  has_tower: boolean // Does miner have tower height > 0 ?
  is_active: boolean // Has miner submitted proofs in current epoch?
}

export interface MinerPermissionTreeResponse extends PermissionNodeMiner {
  children: PermissionNodeMiner[]
}

export interface MinerEpochStatsResponse {
  epoch: number
  count: number
}

export interface EpochStatsResponse {
  epoch: number
  height: number
  timestamp: number
}

export interface EpochProofsResponse {
  epoch: number
  miners: number // Total accounts submitting proofs in epoch (miners and validators)
  proofs: number // Total number of miner proofs in epoch for all miners
  validator_proofs: number // How many of the proofs were by validators
  miner_proofs: number // How many of the proofs were by miners
  miners_payable: number // Number of miners that are above payment threshold
  miners_payable_proofs: number // Total number of proofs submitted by miners that are above the payment threshold
  miner_payment_total: number // Total 0L distributed amonst miners
}

export interface EpochProofsHistogramResponse {
  proofs: number
  count: number // miners with this total number of proofs for the specified epoch
}