/**
 * Google Analytics Event Names
 *
 * Following naming pattern: [section]_[component]_[action]
 * All lowercase with underscores
 * Self-descriptive names that need no additional documentation
 */

// Navigation Events
export const NAVIGATION_EVENTS = {
  // Header Navigation
  HEADER_HOME_CLICK: "navigation_header_home_click",
  HEADER_LEARN_CLICK: "navigation_header_learn_click",
  HEADER_DATA_CLICK: "navigation_header_data_click",

  // Main Navigation Links
  MAIN_OVERVIEW_CLICK: "navigation_main_overview_click",
  MAIN_SILO_CLICK: "navigation_main_silo_click",
  MAIN_FIELD_CLICK: "navigation_main_field_click",
  MAIN_SWAP_CLICK: "navigation_main_swap_click",
  MAIN_PODMARKET_CLICK: "navigation_main_podmarket_click",
  MAIN_SPINTO_CLICK: "navigation_main_spinto_click",
  MAIN_COLLECTION_CLICK: "navigation_main_collection_click",

  // Explorer Sub-navigation
  EXPLORER_PINTO_CLICK: "navigation_explorer_pinto_click",
  EXPLORER_SILO_CLICK: "navigation_explorer_silo_click",
  EXPLORER_FIELD_CLICK: "navigation_explorer_field_click",
  EXPLORER_FARMER_CLICK: "navigation_explorer_farmer_click",
  EXPLORER_SEASONS_CLICK: "navigation_explorer_seasons_click",
  EXPLORER_ALL_CLICK: "navigation_explorer_all_click",

  // Learn Sub-navigation
  LEARN_DOCS_CLICK: "navigation_learn_docs_click",
  LEARN_BLOG_CLICK: "navigation_learn_blog_click",
  LEARN_COMMUNITY_BLOG_CLICK: "navigation_learn_community_blog_click",
  LEARN_WHITEPAPER_CLICK: "navigation_learn_whitepaper_click",

  // Header Buttons
  PRICE_BUTTON_TOGGLE: "navigation_price_button_toggle",
  TOKEN_PRICES_TOGGLE: "navigation_token_prices_toggle",
  SEASONS_BUTTON_TOGGLE: "navigation_seasons_button_toggle",

  // Mobile Navigation
  MOBILE_MENU_TOGGLE: "navigation_mobile_menu_toggle",
} as const;

// Wallet Events
export const WALLET_EVENTS = {
  // Connection
  CONNECT_BUTTON_CLICK: "wallet_connect_button_click",
  CONNECT_MODAL_OPEN: "wallet_connect_modal_open",
  CONNECT_SUCCESS: "wallet_connect_success",
  DISCONNECT_CLICK: "wallet_disconnect_click",

  // Wallet Panel
  PANEL_OPEN: "wallet_panel_open",
  PANEL_CLOSE: "wallet_panel_close",
  BALANCE_TAB_SWITCH: "wallet_balance_tab_switch",

  // Navigation Actions
  PANEL_SWAP_NAVIGATE: "wallet_panel_swap_navigate",
  PANEL_SEND_NAVIGATE: "wallet_panel_send_navigate",
  PANEL_NFT_COLLECTION_NAVIGATE: "wallet_panel_nft_collection_navigate",

  // Wallet Management
  DISCONNECT_BUTTON_CLICK: "wallet_disconnect_button_click",
  FARM_BALANCE_MANAGE_CLICK: "wallet_farm_balance_manage_click",

  // Actions
  CLAIM_FLOOD_SUBMIT: "wallet_claim_flood_submit",
  CLAIM_FLOOD_TOGGLE: "wallet_claim_flood_toggle",
  CLAIM_DESTINATION_SELECT: "wallet_claim_destination_select",
  TRANSFER_BUTTON_CLICK: "wallet_transfer_button_click",
  TRANSFER_MODE_ENTER: "wallet_transfer_mode_enter",
  TRANSFER_MODE_EXIT: "wallet_transfer_mode_exit",
  TRANSFER_DIRECTION_TOGGLE: "wallet_transfer_direction_toggle",
  TRANSFER_SUBMIT: "wallet_transfer_submit",
} as const;

// Silo Events
export const SILO_EVENTS = {
  // Tabs
  DEPOSIT_TAB_CLICK: "silo_deposit_tab_click",
  WITHDRAW_TAB_CLICK: "silo_withdraw_tab_click",
  CONVERT_TAB_CLICK: "silo_convert_tab_click",

  // Token Selection
  DEPOSIT_TOKEN_SELECT_OPEN: "silo_deposit_token_select_open",
  DEPOSIT_TOKEN_SELECTED: "silo_deposit_token_selected",
  WITHDRAW_TOKEN_SELECT_OPEN: "silo_withdraw_token_select_open",
  WITHDRAW_TOKEN_SELECTED: "silo_withdraw_token_selected",

  // Actions
  DEPOSIT_SUBMIT: "silo_deposit_submit",
  WITHDRAW_SUBMIT: "silo_withdraw_submit",
  CONVERT_SUBMIT: "silo_convert_submit",

  // Amount Inputs
  DEPOSIT_AMOUNT_INPUT: "silo_deposit_amount_input",
  WITHDRAW_AMOUNT_INPUT: "silo_withdraw_amount_input",

  // Strategy Selection
  CONVERT_STRATEGY_SELECT: "silo_convert_strategy_select",
} as const;

// Field Events
export const FIELD_EVENTS = {
  // Actions
  SOW_SUBMIT: "field_sow_submit",
  HARVEST_SUBMIT: "field_harvest_submit",

  // Amount Inputs
  SOW_AMOUNT_INPUT: "field_sow_amount_input",

  // Tractor Orders
  TRACTOR_ORDER_CREATE: "field_tractor_order_create",
  TRACTOR_ORDER_CANCEL: "field_tractor_order_cancel",
} as const;

// Swap Events
export const SWAP_EVENTS = {
  // Token Selection
  TOKEN_FROM_SELECT_OPEN: "swap_token_from_select_open",
  TOKEN_FROM_SELECTED: "swap_token_from_selected",
  TOKEN_TO_SELECT_OPEN: "swap_token_to_select_open",
  TOKEN_TO_SELECTED: "swap_token_to_selected",
  TOKEN_PAIR_FLIP: "swap_token_pair_flip",

  // Settings
  SLIPPAGE_SETTING_CHANGE: "swap_slippage_setting_change",
  ROUTING_INFO_OPEN: "swap_routing_info_open",

  // Actions
  SWAP_SUBMIT: "swap_submit",
  AMOUNT_INPUT: "swap_amount_input",
} as const;

// Market Events (Pod Market)
export const MARKET_EVENTS = {
  // Pod Actions
  POD_LIST_CREATE: "market_pod_list_create",
  POD_ORDER_CREATE: "market_pod_order_create",
  POD_LIST_CANCEL: "market_pod_list_cancel",
  POD_ORDER_CANCEL: "market_pod_order_cancel",
  POD_LIST_FILL: "market_pod_list_fill",
  POD_ORDER_FILL: "market_pod_order_fill",
} as const;

// Footer Events
export const FOOTER_EVENTS = {
  // Internal Links
  ABOUT_CLICK: "footer_about_click",
  TERMS_PRIVACY_CLICK: "footer_terms_privacy_click",
  PINTO_EXCHANGE_CLICK: "footer_pinto_exchange_click",

  // Social Links
  DISCORD_CLICK: "footer_social_discord_click",
  TWITTER_CLICK: "footer_social_twitter_click",
  GITHUB_CLICK: "footer_social_github_click",
} as const;

// UI Component Events
export const UI_EVENTS = {
  // Modals & Dialogs
  MODAL_OPEN: "ui_modal_open",
  MODAL_CLOSE: "ui_modal_close",
  DIALOG_CONFIRM: "ui_dialog_confirm",
  DIALOG_CANCEL: "ui_dialog_cancel",

  // Tables & Lists
  TABLE_SORT: "ui_table_sort",
  TABLE_FILTER: "ui_table_filter",
  PAGINATION_CLICK: "ui_pagination_click",

  // Charts
  CHART_TIMEFRAME_SELECT: "ui_chart_timeframe_select",
  CHART_TYPE_SELECT: "ui_chart_type_select",
} as const;

// Transaction Events
export const TRANSACTION_EVENTS = {
  // Transaction Flow
  TRANSACTION_INITIATED: "transaction_initiated",
  TRANSACTION_CONFIRMED: "transaction_confirmed",
  TRANSACTION_FAILED: "transaction_failed",
  TRANSACTION_CANCELLED: "transaction_cancelled",

  // Gas & Fees
  GAS_ESTIMATION_REQUEST: "transaction_gas_estimation_request",
  TRANSACTION_SPEED_SELECT: "transaction_speed_select",
} as const;

// All events combined for easy access
export const ANALYTICS_EVENTS = {
  NAVIGATION: NAVIGATION_EVENTS,
  WALLET: WALLET_EVENTS,
  SILO: SILO_EVENTS,
  FIELD: FIELD_EVENTS,
  SWAP: SWAP_EVENTS,
  MARKET: MARKET_EVENTS,
  FOOTER: FOOTER_EVENTS,
  UI: UI_EVENTS,
  TRANSACTION: TRANSACTION_EVENTS,
} as const;

// Type for all possible event names
export type AnalyticsEventName =
  | (typeof NAVIGATION_EVENTS)[keyof typeof NAVIGATION_EVENTS]
  | (typeof WALLET_EVENTS)[keyof typeof WALLET_EVENTS]
  | (typeof SILO_EVENTS)[keyof typeof SILO_EVENTS]
  | (typeof FIELD_EVENTS)[keyof typeof FIELD_EVENTS]
  | (typeof SWAP_EVENTS)[keyof typeof SWAP_EVENTS]
  | (typeof MARKET_EVENTS)[keyof typeof MARKET_EVENTS]
  | (typeof FOOTER_EVENTS)[keyof typeof FOOTER_EVENTS]
  | (typeof UI_EVENTS)[keyof typeof UI_EVENTS]
  | (typeof TRANSACTION_EVENTS)[keyof typeof TRANSACTION_EVENTS];
