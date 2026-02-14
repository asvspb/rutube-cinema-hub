# Stage 1 Refactoring Plan

## Goals:

1. Convert App.tsx to composition-only layer (≤500 lines)
2. Fix useChannelMenu to use real handlers from useChannels
3. Create unified state management
4. Remove duplicate code

## Tasks:

### Phase 1: Fix useChannelMenu

- [ ] 1.1 Update useChannelMenu.ts to accept handleRenameChannel and handleRemoveChannel from useChannels
- [ ] 1.2 Implement handleRenameChannelSave to call injected handler
- [ ] 1.3 Implement handleRemoveChannel to call injected handler

### Phase 2: Create unified composition hook

- [ ] 2.1 Create useAppComposition.ts that combines all state/effects
- [ ] 2.2 Move all state from App.tsx to useAppComposition
- [ ] 2.3 Move all effects from App.tsx to useAppComposition
- [ ] 2.4 Move all computed values from App.tsx to useAppComposition
- [ ] 2.5 Move all handlers from App.tsx to useAppComposition

### Phase 3: Refactor App.tsx

- [ ] 3.1 Replace App.tsx state with useAppComposition()
- [ ] 3.2 Wire hooks properly (useSearch, useSortingAndGrid, etc.)
- [ ] 3.3 Render Navigation, MainContent, and Modals
- [ ] 3.4 Remove all useState, useEffect, useMemo from App.tsx

### Phase 4: Test and Verify

- [ ] 4.1 Run TypeScript build to check for errors
- [ ] 4.2 Test App loads without console errors
- [ ] 4.3 Test channel switch works
- [ ] 4.4 Test channel menu rename/remove works
- [ ] 4.5 Verify proxy still works

## Quality Gates:

- App.tsx line count ≤ 500
- No duplicated computed blocks
- useChannelMenu has real functionality
- Proxy scheme unchanged
