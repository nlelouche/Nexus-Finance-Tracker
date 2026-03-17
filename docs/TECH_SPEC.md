# TECHNICAL SPECIFICATION: NEXUS - PERSONAL FINANCE MANAGER

## PROJECT OVERVIEW
Nexus is a sophisticated, client-side personal finance management application designed for individuals with multi-currency income streams and complex financial tracking needs. Built as a progressive web app (PWA) with a focus on ultra-modern UI/UX, glassmorphism aesthetics, and intelligent financial insights.

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: March 16, 2026  
**Primary Goal**: Provide beautiful, intelligent financial tracking without backend dependencies

---

## TECHNOLOGY STACK

### Core Framework
- **React 19.2.4** - Latest concurrent rendering with automatic batching
- **Vite 8.0.0** - Lightning-fast build tool with native ESM support
- **TypeScript 5.9.3** - Strict typing for enhanced developer experience
- **Zustand 5.0.11** - Minimalist state management with middleware support
- **React Router DOM 6.22.0** - Declarative routing for SPA navigation

### Styling & Animation
- **TailwindCSS 4.2.1** (via `@tailwindcss/postcss`) - Utility-first CSS with JIT compilation
- **PostCSS 8.4.38** - CSS transformation engine
- **Autoprefixer 10.4.19** - Vendor prefix automation
- **Framer Motion 11.0.14** (planned) - For advanced animations in future releases
- **CSS Variables** - Custom properties for theme consistency

### State Persistence
- **localStorage** - Encrypted client-side storage with versioning
- **Zustand Persist Middleware** - Automatic hydration/dehydration
- **Data Versioning** - Schema migration support for future updates

### Development Tooling
- **ESLint 9.39.4** - Code quality enforcement
- **TypeScript Compiler** - Strict type checking
- **Vite Plugin React** - Fast refresh and HMR
- **Vitest** (planned) - Unit testing framework
- **Playwright** (planned) - E2E testing

---

## ARCHITECTURE OVERVIEW

### High-Level Structure
```
src/
├── components/
│   ├── layout/           # Sidebar, Header, Navigation
│   ├── ui/               # Reusable primitives (Card, Button, etc.)
│   ├── dashboard/        # Main overview with insights
│   ├── income/           # Income tracking module
│   ├── expenses/         # Expense categorization & analytics
│   ├── investments/      # Portfolio performance tracker
│   ├── goals/            # Savings goals with prediction engine
│   └── settings/         # Configuration & data management
├── store/                # Zustand store with persistence
├── lib/                  # Utility functions (currency, formatters)
├── types/                # Centralized TypeScript interfaces
├── index.css             # Design system & global styles
└── App.tsx              # Root component with routing
```

### Data Flow Architecture
```
User Action → Component Event → Zustand Store Action → 
State Update → localStorage Persistence → 
Selector Re-renders → Updated UI
```

All state mutations flow through centralized actions ensuring predictable state transitions and enabling time-travel debugging.

---

## CORE FEATURES SPECIFICATION

### 1. Multi-Currency Financial Engine
**Implementation**: 
- Currency codes: `ARS`, `USD`, `EUR` (extensible via config)
- Exchange rates stored as bidirectional pairs with timestamps
- Automatic conversion using triangular arbitrage when direct rates unavailable
- Base currency selection for global net worth calculations

**Key Functions** (`src/lib/currency.ts`):
- `convertCurrency(amount, from, to, rates)` - Handles direct, inverse, and via-base conversions
- `getExchangeRate(from, to, rates)` - Returns rate or null if unavailable
- `formatExchangeRate(from, to, rate)` - Display formatting
- `getDefaultExchangeRates()` - Seed rates for new users

**Precision**: Uses JavaScript Number (IEEE 754) with rounding to 2 decimal places for display, full precision for calculations.

### 2. Intelligent Limbo Analyzer™
**Innovation**: Proprietary algorithm that detects untracked funds by comparing declared income against declared expenses, highlighting potential unreported spending or missing savings allocations.

**Calculation**:
```
Limbo = Monthly Income - Declared Expenses
Limbo % = (Limbo / Monthly Income) × 100
```

**Status Indicators**:
- **Healthy** (<15%): Excellent tracking discipline
- **Medium** (15-30%): Moderate untracked funds - review recommended
- **High** (>30%): Significant untracked funds - immediate action suggested

**Implementation** (`src/store/useFinanceStore.ts`):
- `getLimboAnalysis(month?)`: Returns detailed breakdown with status
- Integrated into Dashboard with visual indicators and actionable insights

### 3. Goal Prediction Engine
**Features**:
- Linear projection based on current savings rate
- Dynamic adjustment as income/expenses change
- "On Track" vs "At Risk" status calculation
- Estimated completion date with confidence indicators

**Formula**:
```
Months to Goal = (Target - Current) / Monthly Savings Rate
Estimated Date = Today + Months to Goal
```

### 4. Investment Performance Tracker
**Capabilities**:
- Multiple asset classes: Funds, Crypto, Fixed Deposits, Stocks, Other
- Real-time gain/loss calculation (absolute and percentage)
- Time-weighted return (TWR) calculation planned
- Asset allocation visualization
- Dividend/interest tracking (planned)

### 5. Smart Expense Categorization
**Predefined Categories**:
- Housing (Rent/Mortgage)
- Food & Dining
- Utilities & Services
- Transportation
- Entertainment
- Shopping
- Health & Wellness
- Education
- Gifts & Donations
- Other (customizable)

### 6. Income Source Management
**Job Types**:
- Permanent Employment
- Temporary/Contract Work
- Freelance/Gig Income
- Passive Income
- Other Sources

### 7. Goal-Based Savings System
**Goal Types**:
- Short-term (<1 year): Emergency fund, vacation
- Medium-term (1-5 years): Down payment, education
- Long-term (>5 years): Retirement, legacy

---

## VISUAL DESIGN SYSTEM

### Core philosophy
"Neumorphism 2.0" - Sophisticated glassmorphism with depth, subtle animations, and purposeful micro-interactions. Inspired by Apple's visionOS and Microsoft's Fluent Design System 2.

### Color Palette
#### Neutrals
- **Background**: `#080808` (Near-black for true OLED blacks)
- **Surface**: `#121212` (Elevated surface)
- **Surface Hover**: `#1a1a1a` (Interactive state)
- **Glass**: `rgba(24, 24, 27, 0.7)` (Frosted glass effect)

#### Primary Accents
- **Success**: `#34d399` (Emerald green - positive trends)
- **Warning**: `#fbbf24` (Amber - caution)
- **Error**: `#f87171` (Rose red - negative trends)
- **Info**: `#60a5fa` (Sky blue - neutral information)

#### Text Hierarchy
- **Primary**: `#ededed` (Main content)
- **Secondary**: `#a1a1aa` (Subtext, labels)
- **Muted**: `#71717a` (Placeholder, disabled)

### Typography
- **Primary Font**: Inter (optimized for screen readability)
- **Font Weights**: 400, 500, 600, 700
- **Responsive sizes**: 12px to 60px scale

### Spacing System
Based on 4px grid: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

### Border Radius
- `sm`: 2px, `md`: 4px, `lg`: 6px, `xl`: 8px, `2xl`: 12px, `full`: 9999px

### Shadow System
Multiple depth levels from subtle `sm` to dramatic `2xl` for modal overlays.

### Transition & Animation
- **Duration**: 100ms (micro), 200ms (normal), 300ms (slow), 400ms (delayed)
- **Easing**: Material Design 3 bezier curves
- **Types**: Fade, scale, slide, pulse, float

---

## COMPONENT LIBRARY

### Primitive Components (`src/components/ui/`)
- **Button**: Primary, Secondary, Danger, Ghost variants; SM/MD/LG sizes
- **Input**: Text, Number, Date, Month types; label, error, prefix/suffix
- **Select**: Searchable options, grouped, custom rendering
- **Card**: Default, Highlighted, Glass variants; hover effects
- **ProgressBar**: Determinate/indeterminate; gradient support; multiple sizes

### Layout Components (`src/components/layout/`)
- **Sidebar**: 240px fixed width, glassmorphism, responsive collapse
- **MobileHeader**: 56px height, hamburger menu, page title

---

## MODULE IMPLEMENTATIONS

### Dashboard (`src/components/dashboard/Dashboard.tsx`)
- Net Worth, Income, Expenses metric cards
- Limbo Analyzer widget with status indicators
- Recent Transactions feed
- Goals summary with progress bars

### Income (`src/components/income/IncomeModule.tsx`)
- Entry form with smart defaults
- Chronological list with grouping
- Monthly totals breakdown

### Expenses (`src/components/expenses/ExpenseModule.tsx`)
- Expense entry with category selection
- Donut chart for category distribution
- Recent expenses list

### Investments (`src/components/investments/InvestmentModule.tsx`)
- Portfolio overview cards
- Gain/loss calculation (absolute & %)
- Position management with inline editing

### Goals (`src/components/goals/GoalModule.tsx`)
- Goal cards with progress bars
- Prediction estimator ("at current pace")
- Contribution form

### Settings (`src/components/settings/SettingsPage.tsx`)
- Base currency selection
- Jobs/income sources management
- Exchange rate configuration
- Data export/reset

---

## API INTEGRATIONS

### Current State
- **No External APIs** - Pure client-side
- **Data Storage**: localStorage with versioning
- **Privacy**: Zero data transmission

### Planned Integrations (Future)
- **Banking**: Plaid/Yodlee for transaction sync
- **Market Data**: Alpha Vantage, CoinGecko
- **Currency Rates**: ExchangeRate-API, Frankfurter
- **OCR**: Google Vision, Mindee for receipts

---

## PERFORMANCE OPTIMIZATION

### Bundle
- Code splitting with lazy loading
- Tree shaking for unused code
- Route-based dynamic imports

### Rendering
- React.memo for expensive components
- useMemo/useCallback for computations
- Virtual scrolling for long lists

### Data
- Selective persistence (changed slices only)
- Debounced localStorage writes
- Immutable state updates

---

## ACCESSIBILITY (WCAG 2.1 AA)

- **Visual**: 4.5:1 contrast, scalable text, focus indicators
- **Keyboard**: Full navigation without mouse
- **Screen Reader**: Semantic HTML, ARIA labels
- **Motion**: Respects prefers-reduced-motion

---

## SECURITY & PRIVACY

- Client-side only - data never leaves device
- No telemetry or tracking
- CSP headers for XSS prevention
- Prepared for localStorage encryption (future)

---

## BUILD & DEPLOY

```bash
# Development
npm run dev          # http://localhost:5173

# Production
npm run build       # Creates dist/

# Preview
npm run preview     # Serves dist/
```

### Deployment Targets
- Netlify, Vercel, Cloudflare Pages
- GitHub Pages
- Any static file server

---

## ROADMAP

### Phase 1.5: Polish (Current)
- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] i18n framework

### Phase 2: Connected Finance (Q3-Q4 2026)
- [ ] Bank integration (Plaid)
- [ ] Live market data
- [ ] Receipt OCR
- [ ] Shared household

### Phase 3: Wealth Intelligence (2027)
- [ ] AI financial coaching
- [ ] Cash flow forecasting
- [ ] Scenario planning
- [ ] Behavioral insights

---

## CONCLUSION

Nexus combines cutting-edge technology with sophisticated financial intelligence to deliver a premium personal finance experience:

- ✅ Modern React stack with optimal performance
- ✅ Intelligent Limbo Analyzer™ for expense awareness
- ✅ Goal prediction engine
- ✅ Glassmorphism UI with thoughtful interactions
- ✅ Absolute privacy (client-only storage)
- ✅ Enterprise-quality codebase

The application successfully addresses multi-currency income tracking, expense awareness, goal achievement prediction, and financial insights—while maintaining a premium, intuitive interface.

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-16*  
*© 2026 Nexus Financial Technologies*
