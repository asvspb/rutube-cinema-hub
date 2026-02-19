# Testing Suite for Kino Club

This directory contains comprehensive tests to verify the application's functionality after changes.

## Test Script

### `run_comprehensive_tests.sh`

This script performs a full verification of the application including:

1. **Prerequisites Check** - Verifies required commands (npm, node, curl) are available
2. **File Structure Validation** - Ensures all required files and directories exist
3. **Configuration Verification** - Checks that configuration files are properly set up
4. **TypeScript Compilation** - Validates that TypeScript compiles without errors
5. **Backend Server Test** - Starts and tests the backend server functionality
6. **Frontend Server Test** - Starts and tests the frontend server functionality
7. **Package Scripts Test** - Verifies build and other npm scripts work
8. **Playlist Data Retrieval Test** - Tests the ability to fetch playlist data from Rutube
9. **Individual Video Functionality Test** - Tests individual video features including AI rating endpoints
10. **Server Log Error Check** - Monitors server logs for errors during operation

## How to Run Tests

```bash
# Run all comprehensive tests
./tests/run_comprehensive_tests.sh

# Or from the project root
bash tests/run_comprehensive_tests.sh
```

## When to Run Tests

Run these tests after making any changes to ensure:

- All functionality remains intact
- TypeScript compiles without errors
- Both frontend and backend servers work correctly
- Configuration files are properly set up
- File structure remains consistent

## Test Coverage

The tests cover:

- File structure integrity
- Configuration correctness
- Server startup and basic functionality
- API endpoint accessibility
- Security validations
- Build process
- TypeScript type checking
- Playlist data retrieval from Rutube
- Individual video functionality including AI rating endpoints
- Proxy functionality for external API requests
- Server log monitoring for errors

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed
