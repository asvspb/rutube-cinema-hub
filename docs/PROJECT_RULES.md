# PROJECT RULES

> **Дата создания:** 2026-02-08  
> **Последнее обновление:** 2026-02-17  
> **Статус:** ✅ Актуально

## Core Development Principles

### 1. Testing & Quality Assurance

**Rule**: Every change must be thoroughly tested before deployment.

**Implementation**:

- Write tests for all new features and bug fixes
- Run the full test suite before committing: `npm test`
- Test types to implement:
  - **Unit tests**: Test individual functions and components in isolation
  - **Integration tests**: Test how components work together
  - **Smoke tests**: Basic functionality checks (already implemented in `scripts/smoke-test.sh`)
  - **Manual testing**: Test user flows in the browser

**Testing Checklist**:

- [ ] Does the feature work as expected?
- [ ] Are edge cases handled?
- [ ] Does it work across different screen sizes?
- [ ] Are error states properly handled?
- [ ] Did you test with real API responses?

---

### 2. Comprehensive Logging

**Rule**: All application actions must be reflected in logs for accurate debugging.

**Implementation**:

- Use structured logging with clear log levels
- Log level configuration:
  - **DEVELOPMENT**: Use `debug` level for maximum verbosity
  - **PRODUCTION**: Switch to `info` or `warn` level (controlled via environment variables)

**What to log**:

```typescript
// User interactions
console.log('[USER_ACTION]', { action: 'button_click', component: 'VideoPlayer', timestamp: Date.now() });

// API calls
console.debug('[API_REQUEST]', { endpoint: '/api/videos', method: 'GET', params: {...} });
console.debug('[API_RESPONSE]', { endpoint: '/api/videos', status: 200, duration: '145ms' });

// Errors (with full context)
console.error('[ERROR]', {
  message: error.message,
  stack: error.stack,
  context: { userId, videoId, action: 'play_video' }
});

// State changes
console.debug('[STATE_CHANGE]', { from: 'idle', to: 'loading', reason: 'user_initiated' });

// Performance metrics
console.info('[PERFORMANCE]', { action: 'video_load', duration: '2.3s', cached: false });
```

**Log file locations**:

- Error logs: `error_logs.json` (already in use)
- General logs: Console output (captured by hosting platform in production)

**Best practices**:

- Always include timestamp
- Add contextual information (user ID, video ID, etc.)
- Use consistent prefixes like `[API_REQUEST]`, `[ERROR]`, `[USER_ACTION]`
- Never log sensitive data (passwords, tokens, personal information)

---

### 3. Documentation & Orientation

**Rule**: Leave detailed hints about structure and implemented logic in every folder and document to avoid getting lost.

**Implementation**:

#### A. Folder-level documentation

Every directory should contain a `README.md` explaining:

- Purpose of the folder
- Key files and their responsibilities
- Relationships with other parts of the application

Example structure:

```
components/
  ├── README.md          # Overview of all components
  ├── VideoPlayer/
  │   ├── README.md      # VideoPlayer-specific docs
  │   ├── VideoPlayer.tsx
  │   └── VideoPlayer.test.tsx
  └── SearchBar/
      ├── README.md
      └── SearchBar.tsx
```

#### B. File-level documentation

Every significant file should have:

- **Header comment** explaining purpose and responsibilities
- **Function/component documentation** with JSDoc comments
- **Complex logic explanations** inline

Example:

```typescript
/**
 * VideoPlayer Component
 *
 * Purpose: Renders video player with playback controls
 * Dependencies: lucide-react, framer-motion
 * State management: Local state for playback status
 *
 * Used in: App.tsx, VideoModal.tsx
 * Related: services/videoService.ts, types.ts
 */

/**
 * Handles video playback start
 * @param videoId - Unique identifier of the video
 * @returns Promise that resolves when playback starts
 *
 * Flow:
 * 1. Log user action
 * 2. Fetch video URL from API
 * 3. Initialize player
 * 4. Track analytics
 */
const handlePlay = async (videoId: string) => {
  // Implementation
};
```

#### C. Architecture documentation

Maintain high-level documentation:

- `docs/ARCHITECTURE.md` - Overall system design
- `docs/API_REFERENCE.md` - API endpoints and responses
- `docs/COMPONENT_HIERARCHY.md` - Component tree structure
- `docs/STATE_MANAGEMENT.md` - How state flows through the app

#### D. Decision logs

Document important decisions:

- Why certain libraries were chosen
- Why specific architectural patterns were used
- Trade-offs that were considered

---

### 4. Clean Project Root

**Rule**: Never save anything to the project root without extreme necessity. If you can't find the right place for a document, create a new folder.

**Allowed in root**:

- Configuration files: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`
- Environment files: `.env.local`
- Essential docs: `README.md`
- Build outputs: `dist/` (gitignored)
- Dependencies: `node_modules/` (gitignored)

**Should be organized elsewhere**:

- Source code → `src/` or current structure (`components/`, `services/`)
- Documentation → `docs/`
- Test files → `__tests__/` or co-located with source files
- Scripts → `scripts/`
- Assets → `assets/` or `public/`
- Types → `types/` or `src/types/`
- Configuration → `config/` (if multiple complex configs exist)

**Current structure mapping**:

```
rutube-cinema-hub/
├── components/       # React components with README.md
├── services/         # API and business logic with README.md
├── scripts/          # Build and utility scripts with README.md
├── docs/             # All documentation
├── screenshots/      # UI screenshots (consider moving to docs/screenshots/)
├── dist/             # Build output (gitignored)
└── [config files]    # Keep only essential configs in root
```

**Action items**:

- [ ] Move `App.tsx`, `index.tsx`, `types.ts` to `src/` folder
- [ ] Move screenshots to `docs/screenshots/`
- [ ] Move server/index.js to `server/` or `backend/`
- [ ] Create README.md files in each folder

---

## Development Workflow

### Before Starting Work

1. Read the prompt/task carefully
2. Ask at least **5 clarifying questions** to ensure correct understanding:
   - What is the expected behavior?
   - What are the edge cases?
   - What should happen on errors?
   - Are there performance considerations?
   - How should this be tested?
3. Review relevant documentation in `docs/`
4. Check existing patterns in the codebase

### During Development

1. Write code with logging statements
2. Test incrementally
3. Update documentation as you go
4. Commit frequently with clear messages

### Before Committing

1. Run tests: `npm test`
2. Check logs work correctly
3. Review your changes
4. Update relevant documentation
5. Ensure nothing unnecessary is added to root

### Code Review Checklist

- [ ] Tests added and passing
- [ ] Logging implemented for all user actions
- [ ] Documentation updated
- [ ] No files added to root unnecessarily
- [ ] Error handling implemented
- [ ] Performance considered

---

## File Organization Standards

### Naming Conventions

- **Components**: PascalCase (`VideoPlayer.tsx`)
- **Utilities/Services**: camelCase (`videoService.ts`)
- **Types**: PascalCase in `types.ts` or co-located
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Tests**: `*.test.tsx` or `*.spec.tsx`

### Folder Structure

```
component/
├── README.md              # Component documentation
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Tests
├── types.ts               # Local types (if complex)
└── utils.ts               # Component-specific utilities
```

---

## Emergency Procedures

### When Things Break

1. Check `error_logs.json` for recent errors
2. Review console logs with debug level enabled
3. Check git history: `git log --oneline`
4. Revert if needed: `git revert <commit>`
5. Document the issue in `docs/KNOWN_ISSUES.md`

### When Lost in Codebase

1. Start from `docs/ARCHITECTURE.md`
2. Read folder-level `README.md` files
3. Follow component hierarchy documentation
4. Use logging to trace execution flow

---

## Tools & Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run test suite
```

### Debugging

```bash
# View recent error logs
cat error_logs.json | tail -n 50

# Watch logs in real-time (when implemented)
tail -f logs/app.log
```

---

## Version Control

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:

```
feat(video-player): add playback speed control

- Added speed selector dropdown
- Logged user speed changes
- Updated VideoPlayer README

Closes #123
```

---

## Questions?

If you're unsure about any rule or need clarification:

1. Check this document first
2. Review relevant documentation in `docs/`
3. Ask the team
4. Document the answer here for future reference

---

**Last Updated**: 2026-02-03  
**Maintained By**: Development Team
