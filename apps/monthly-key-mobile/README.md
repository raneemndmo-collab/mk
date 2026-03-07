# Monthly Key Mobile (المفتاح الشهري)

A React Native + Expo SDK 51 mobile application for monthly rental property management in Saudi Arabia.

## Stack

- **Framework:** Expo SDK 51 + Expo Router v3
- **Language:** TypeScript (strict mode)
- **State Management:** Zustand + React Query
- **API Client:** tRPC client consuming `https://monthlykey.com/api/trpc`
- **Auth:** SecureStore-based token management
- **i18n:** Arabic-first with English support, full RTL
- **Theme:** Dark (navy) / Light mode toggle

## Core Formula

```
Monthly Rent = Daily Rate × 30 × (1 − discount%)
```

Default discount: **18%**

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation
│   │   ├── index.tsx       # Home screen
│   │   ├── search.tsx      # Property search
│   │   ├── bookings.tsx    # My bookings
│   │   └── profile.tsx     # User profile
│   ├── auth/
│   │   └── login.tsx       # Login screen
│   ├── property/
│   │   └── [id].tsx        # Property detail
│   └── booking/
│       └── [propertyId].tsx # Booking flow
├── components/             # Reusable UI components
├── contexts/               # React contexts (Auth, I18n, Theme)
├── hooks/                  # Custom hooks
├── lib/
│   ├── api/                # tRPC API client
│   ├── types.ts            # TypeScript type definitions
│   └── utils/              # Utility functions (pricing, notifications)
└── __tests__/              # Test suites
    ├── golden/             # Snapshot / regression tests
    ├── components/         # Widget / component tests
    ├── integration/        # API + Auth + Navigation flow tests
    ├── performance/        # Memory & performance tests
    └── firebase/           # Firebase emulator tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:golden` | Run golden / snapshot tests |
| `npm run test:widget` | Run component tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:performance` | Run performance tests |
| `npm run test:firebase` | Run Firebase emulator tests |
| `npm run test:all` | Run all tests with coverage |
| `npm run test:ci` | Run tests in CI mode |

## Hard Rules

1. **Zero AI/LLM API calls** anywhere in test files — all assertions are deterministic
2. **Saudi locale throughout** — SAR currency, Arabic names, +966 phone numbers, Arabic city names
3. **No real credentials** — mock Moyasar, mock Firebase, mock tRPC via MSW
4. **Firebase Emulator only** — never connect to production Firebase project
5. **RTL assertions required** in every UI component test
6. **`notification.subscribe` must be tested** — the wrong endpoint (`registerPushToken`) must fail the test if used
7. **VAT must appear in cost breakdown tests** — any test that checks totals must verify VAT is included
