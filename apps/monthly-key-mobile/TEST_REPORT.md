# Monthly Key Mobile — Test Report

## Date: {DATE}
## Commit: {COMMIT_SHA}

| Suite | Tests | Passed | Failed | Coverage |
|-------|-------|--------|--------|----------|
| Golden | — | — | — | — |
| Widget | — | — | — | — |
| Integration | — | — | — | — |
| Performance | — | — | — | — |
| Firebase | — | — | — | — |
| **Total** | — | — | — | — |

## Key Findings

### Pricing Engine
- [ ] Monthly from daily formula correct (18% discount)
- [ ] VAT included on (rent + service fee), not rent alone
- [ ] Deposit excluded from VAT

### Auth
- [ ] Token stored in SecureStore (not AsyncStorage)
- [ ] Session restored on restart
- [ ] Logout clears token + push token

### Push Notifications
- [ ] Uses `notification.subscribe` (not `registerPushToken`)
- [ ] Unsubscribes on logout

### RTL
- [ ] No marginLeft/marginRight in Arabic layout
- [ ] Currency right-aligned
- [ ] All strings from i18n (no hardcoded text)

## Issues Found
{List any failing tests with root cause and suggested fix}
