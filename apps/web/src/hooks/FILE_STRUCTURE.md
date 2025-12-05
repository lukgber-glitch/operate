# useSendMessage - File Structure

Complete file structure for the optimistic message sending implementation.

## Directory Structure

```
apps/web/src/
├── hooks/
│   ├── useSendMessage.ts                 (9.3 KB)  [Core Implementation]
│   ├── useSendMessage.types.ts           (8.8 KB)  [Type Definitions]
│   ├── useSendMessage.example.tsx        (8.5 KB)  [Usage Examples]
│   ├── useSendMessage.test.ts            (14 KB)   [Test Suite]
│   ├── README_SEND_MESSAGE.md            (12 KB)   [Documentation]
│   ├── SEND_MESSAGE_FLOW.md              (23 KB)   [Flow Diagrams]
│   ├── INTEGRATION_GUIDE.md              (17 KB)   [Integration Guide]
│   ├── USESENDMESSAGE_SUMMARY.md         (Summary)
│   └── FILE_STRUCTURE.md                 (This file)
│
└── types/
    └── chat.ts                           (Updated)
```

## Files Overview

### Core Files

**1. useSendMessage.ts** (9.3 KB)
- Main hook implementation
- Optimistic message creation
- API integration
- State management
- Error handling
- Retry logic

**2. useSendMessage.types.ts** (8.8 KB)
- OptimisticMessage interface
- SendMessageResponse interface
- Type guards and validators
- Message filters and comparators
- Error types
- Constants

### Documentation Files

**3. README_SEND_MESSAGE.md** (12 KB)
- Complete feature documentation
- API reference
- Usage examples
- Best practices
- Troubleshooting

**4. SEND_MESSAGE_FLOW.md** (23 KB)
- Visual flow diagrams
- State lifecycle
- Error recovery
- Performance optimization

**5. INTEGRATION_GUIDE.md** (17 KB)
- Step-by-step setup
- Complete examples
- State management patterns
- Styling guides

**6. USESENDMESSAGE_SUMMARY.md**
- Project summary
- Success criteria
- Quick reference

### Development Files

**7. useSendMessage.example.tsx** (8.5 KB)
- 7 complete usage examples
- Real-world patterns
- Best practices

**8. useSendMessage.test.ts** (14 KB)
- Comprehensive test suite
- 25+ test cases
- Full coverage

## Quick Reference

| Need | File |
|------|------|
| How to use | README_SEND_MESSAGE.md |
| Setup guide | INTEGRATION_GUIDE.md |
| Visual flows | SEND_MESSAGE_FLOW.md |
| Code examples | useSendMessage.example.tsx |
| Types | useSendMessage.types.ts |
| Tests | useSendMessage.test.ts |
| Implementation | useSendMessage.ts |

## Total Size

**8 files, ~3,020 lines, 92.6 KB**
