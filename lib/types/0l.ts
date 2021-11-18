import { get } from 'lodash'

export interface Amount {
  amount: number
  currency: string
}

export interface Account {
  address: string
  balances: Amount[]
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

export interface Script {
  type: string
  code: string
  arguments: string[]
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
  preburn_address?: string
}

export interface Event {
  key: string
  sequence_number: number
  transaction_version: number
  data: EventData
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
  transaction: BlockMetadataTransaction | WriteSetTransaction | UserTransaction | UnknownTransaction
  hash: string
  bytes: string
  events: Event[]
  vm_status: VMStatusExecuted | VMStatusOutOfGas | VMStatusMoveAbort | VMStatusExecutionFailure | VMStatusMiscellaneousError
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
  timestamp: number,
  version: number
  chain_id: number
}

export interface MetadataResponse extends NodeRPCResponse {
  result: Metadata
}

export interface TransactionMin {
  type: string
  hash: string
  version: number
  status?: string
  recipient?: string
  sender?: string
  amount?: number
}

export const getTransactionMin = (tx: Transaction): TransactionMin => {
  const script_function = get(tx, 'transaction.script.function_name')
  const status = get(tx, 'vm_status.type')
  const { version, hash } = tx
  const sender = get(tx, 'transaction.sender') || null
  if (script_function === 'create_user_by_coin_tx') {
    const onboard_address = get(tx, 'transaction.script.arguments_bcs[0]')
    if (onboard_address) {
      return {
        type: 'Onboard',
        recipient: onboard_address,
        status,
        sender,
        version,
        hash
      }
    }

  } else if (script_function === 'minerstate_commit' || script_function === 'minerstate_commit_by_operator') {
    return {
      type: 'Miner Proof',
      status,
      sender,
      version,
      hash
    }
  }
  let type: string = tx.transaction.type
  if (type === 'blockmetadata') type = 'Block Metadata'
  return {
    type,
    hash,
    sender,
    version,
    status
  }
}