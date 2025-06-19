# CLAUDE.md - Pinto Interface

## Project Overview

**Pinto Interface** is a React-based decentralized finance (DeFi) application frontend for the Pinto protocol, a DeFi stablecoin system similar to Beanstalk. This interface allows users to interact with the Pinto ecosystem through various financial operations including staking, farming, trading, and yield generation.

### Key Characteristics
- **Protocol**: DeFi stablecoin protocol with algorithmic stability mechanisms
- **Frontend Type**: Modern React SPA with Web3 integration
- **Network**: Primarily Base blockchain, with multi-chain support (Arbitrum, Mainnet)
- **Architecture**: Component-based with sophisticated state management

## Technology Stack

### Core Framework
- **Vite** - Build tool and dev server
- **React 18** - UI framework with React Router for routing
- **TypeScript** - Type safety throughout the application
- **TailwindCSS** - Utility-first CSS framework with custom design system

### Web3 Integration
- **Wagmi** - React hooks for Ethereum interaction
- **Viem** - TypeScript Ethereum library
- **ConnectKit** - Wallet connection UI
- **Contract Code Generation** - Auto-generated hooks from ABIs

### State Management & Data
- **Jotai** - Atomic state management for global state
- **TanStack Query** - Server state management with persistence
- **GraphQL Code Generation** - Generated queries from multiple subgraphs
- **React Hook Form** - Form handling with validation

### Styling & UI
- **Radix UI** - Headless component primitives
- **Framer Motion** - Animation library
- **Custom Design System** - Pinto-branded components
- **Responsive Design** - Mobile-first approach

### Development Tools
- **Biome** - Linting and formatting (replaces ESLint/Prettier)
- **Vitest** - Testing framework
- **Husky** - Git hooks
- **GraphQL Code Generator** - Type-safe GraphQL operations

## Project Structure

```
src/
├── assets/               # Static assets (images, fonts, icons)
├── classes/             # Utility classes (DecimalBigNumber, TokenValue, etc.)
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui style)
│   ├── charts/         # Chart components for data visualization
│   ├── nav/            # Navigation components
│   └── tables/         # Data table components
├── constants/          # Configuration and constants
│   ├── abi/           # Contract ABIs
│   ├── address.ts     # Contract addresses
│   ├── tokens.ts      # Token definitions
│   └── endpoints.ts   # API endpoints
├── encoders/          # Contract function encoders
├── generated/         # Auto-generated files (contracts, GraphQL)
├── hooks/             # Custom React hooks
├── lib/               # Core business logic
|   |__ matcha/        # ZeroX API http request abstraction
│   ├── Swap/          # Swap routing and price calculation
│   ├── Tractor/       # Tractor (automation) system
│   └── siloConvert/   # Silo conversion strategies
├── pages/             # Page components and route handlers
├── queries/           # GraphQL query definitions
├── state/             # Global state management
└── utils/             # Utility functions and helpers
```

## Key Application Areas

### 1. Silo (Staking/Deposit)
- **Purpose**: Users deposit tokens to earn yield and governance tokens (Stalk/Seeds)
- **Key Files**: `src/pages/Silo.tsx`, `src/pages/silo/`, `src/lib/siloConvert/`
- **Features**: Multi-token deposits, automatic compounding, conversion between assets

### 2. Field (Borrowing/Lending)
- **Purpose**: Users can sow (lend) Beans for Pods (future Bean claims)
- **Key Files**: `src/pages/Field.tsx`, `src/pages/field/`
- **Features**: Weather-based interest rates, Pod marketplace

### 3. Market (Pod Trading)
- **Purpose**: Secondary market for trading Pods
- **Key Files**: `src/pages/Market.tsx`, `src/pages/market/`
- **Features**: Order book, listings, price discovery

### 4. Swap
- **Purpose**: Token swapping with DEX aggregation
- **Key Files**: `src/pages/Swap.tsx`, `src/lib/Swap/`
- **Features**: 0x integration, optimal routing, slippage protection

### 5. Explorer (Analytics)
- **Purpose**: Protocol analytics and historical data
- **Key Files**: `src/pages/Explorer.tsx`, `src/pages/explorer/`
- **Features**: Charts, metrics, farmer activity tracking

## Architecture Patterns

### State Management
- **Global State**: Jotai atoms for app-wide state
- **Server State**: TanStack Query for blockchain/API data
- **Local State**: React hooks for component-specific state
- **Persistence**: LocalStorage for user preferences

### Web3 Integration
- **Contract Interactions**: Generated hooks from Wagmi
- **Multi-chain Support**: Chain-specific configurations
- **Mock Development**: Local Anvil fork support with impersonation

### Data Flow
1. **Subgraph Data**: GraphQL queries to protocol subgraphs
2. **On-chain Data**: Direct contract calls for real-time data
3. **Price Data**: External APIs for price feeds
4. **State Updates**: Automated updaters refresh global state

## Development Workflow

### Setup Commands
```bash
yarn install              # Install dependencies
yarn generate            # Generate contracts & GraphQL types
yarn dev                 # Start development server
```

### Key Scripts
```bash
yarn build               # Production build
yarn test                # Run tests
yarn lint:check          # Check linting issues
yarn lint:fix-all        # Fix linting issues
yarn format              # Format code with Biome
```

### Code Generation
- **Contracts**: `yarn wagmi:generate` - Generates typed contract hooks
- **GraphQL**: `yarn graphql-codegen` - Generates typed GraphQL operations
- **Combined**: `yarn generate` - Runs both generators

## Environment Configuration

### Required Environment Variables
```bash
VITE_ALCHEMY_API_KEY=""     # Alchemy RPC provider
VITE_CHAINS=""              # Supported chain IDs (comma-separated)
VITE_BASE_ENDPOINT=""       # Base domain for the application
```

### Development Setup
- **Local Fork**: Use Anvil to fork Base mainnet locally
- **Chain ID 1337**: Local development chain
- **Mock Accounts**: Impersonation support for testing

## Design System

### Theme
- **Primary Colors**: Pinto green variations (#246645 primary)
- **Typography**: Custom Pinto font family
- **Components**: Consistent spacing, border radius, shadows
- **Responsive**: Mobile-first design with custom breakpoints

### Component Patterns
- **Compound Components**: Dialog, Dropdown, Accordion patterns
- **Render Props**: Flexible component composition
- **Hook-based Logic**: Custom hooks for reusable logic
- **Type Safety**: Strict TypeScript throughout

## Build & Deployment

### Production Build
- **Vite Build**: Optimized bundle with tree-shaking
- **Environment Variables**: Runtime configuration via VITE_ prefix
- **Source Maps**: Conditional generation based on environment

### Netlify Deployment
- **Build Command**: `yarn build:netlify`
- **Environment Injection**: Build-time environment variable setup
- **SPA Routing**: Configured redirects for client-side routing

## Testing Strategy

### Unit Tests
- **Framework**: Vitest for fast test execution
- **Location**: `src/__tests/` directory
- **Coverage**: Utility functions and core business logic

### Integration Considerations
- **Mock Providers**: Web3 provider mocking for tests
- **Contract Interactions**: Test against local fork when possible
- **GraphQL Mocking**: Mock subgraph responses

## Common Development Patterns

### Error Handling
- **Toast Notifications**: Sonner for user feedback
- **Error Boundaries**: React error boundaries for fault tolerance
- **Logging**: Discord webhook integration for error reporting

### Performance
- **Code Splitting**: Route-based code splitting
- **Query Optimization**: Selective GraphQL field fetching
- **Caching**: Persistent query cache with storage persister

### Security
- **Input Validation**: Form validation with strict typing
- **Address Validation**: Ethereum address format checking
- **Safe Contract Calls**: Error handling for all blockchain interactions

## Key Files to Understand

1. **App.tsx** - Main routing and layout structure
2. **Providers.tsx** - Provider composition and configuration  
3. **Web3Provider.tsx** - Web3 setup with Wagmi and ConnectKit
4. **StateProvider.tsx** - Global state initialization
5. **constants/tokens.ts** - Token definitions and chain mappings
6. **utils/wagmi/wagmi.config.ts** - Contract configuration for code generation
7. **lib/Swap/swap-router.ts** - Core swap routing logic
8. **lib/siloConvert/** - Silo conversion strategy implementations

## Troubleshooting Common Issues

### Development
- **Enum Types**: ABIs should not contain non-uint8 enums
- **Oracle Timeouts**: Use dev page to update oracle timeouts on local fork
- **Subgraph Sync**: Historical data may not reflect local chain state
- **0x API Issues**: May need to disable 0x during high volatility

### Build Issues  
- **Type Errors**: Run `yarn generate` to ensure types are up to date
- **Memory Issues**: Large TypeScript compilation - consider type optimizations
- **Environment Variables**: Ensure all required VITE_ variables are set

This project represents a sophisticated DeFi frontend with complex state management, multi-chain support, and integration with various DeFi protocols and services.