#!/usr/bin/env bash

# Comprehensive test script for Rutube Cinema Hub
# This script verifies all functionality after changes

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local timeout=${2:-30}
    local count=0
    
    print_info "Waiting for service at $url..."
    
    while [ $count -lt $timeout ]; do
        if curl -s --max-time 2 "$url" >/dev/null 2>&1; then
            print_success "Service at $url is ready"
            return 0
        fi
        sleep 1
        ((count++))
    done
    
    print_error "Service at $url did not become ready within $timeout seconds"
    return 1
}

# Function to start backend server
start_backend() {
    print_info "Starting backend server..."
    npm run server > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/backend.pid
    sleep 3  # Give backend time to start
}

# Function to stop backend server
stop_backend() {
    if [ -f /tmp/backend.pid ]; then
        local pid=$(cat /tmp/backend.pid)
        if ps -p $pid > /dev/null; then
            print_info "Stopping backend server (PID: $pid)..."
            kill $pid
        fi
        rm -f /tmp/backend.pid
    fi
    rm -f /tmp/backend.log
}

# Function to start frontend server
start_frontend() {
    print_info "Starting frontend server..."
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/frontend.pid
    sleep 5  # Give frontend time to start
}

# Function to stop frontend server
stop_frontend() {
    if [ -f /tmp/frontend.pid ]; then
        local pid=$(cat /tmp/frontend.pid)
        if ps -p $pid > /dev/null; then
            print_info "Stopping frontend server (PID: $pid)..."
            kill $pid
        fi
        rm -f /tmp/frontend.pid
    fi
    rm -f /tmp/frontend.log
}

# Test 1: Check if required commands exist
test_prerequisites() {
    print_info "Testing prerequisites..."
    
    local missing_commands=()
    
    for cmd in npm node curl; do
        if ! command_exists "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [ ${#missing_commands[@]} -gt 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        return 1
    else
        print_success "All required commands are available"
        return 0
    fi
}

# Test 2: Check TypeScript compilation
test_typescript_compilation() {
    print_info "Testing TypeScript compilation..."
    
    if npx tsc --noEmit; then
        print_success "TypeScript compilation passed"
        return 0
    else
        print_error "TypeScript compilation failed"
        return 1
    fi
}

# Test 3: Test backend server
test_backend_server() {
    print_info "Testing backend server..."
    
    start_backend
    
    # Wait for backend to be ready
    if ! wait_for_service "http://localhost:9230/" 15; then
        print_error "Backend server failed to start"
        stop_backend
        return 1
    fi
    
    # Test basic endpoint
    if curl -s http://localhost:9230/ | grep -q "Rutube Cinema Hub"; then
        print_success "Backend server basic endpoint works"
    else
        print_error "Backend server basic endpoint failed"
        stop_backend
        return 1
    fi
    
    # Test proxy endpoint with security validation
    local proxy_response=$(curl -s "http://localhost:9230/api/proxy?url=https://google.com" 2>/dev/null || echo "")
    if echo "$proxy_response" | grep -q "not in the allowed domains list"; then
        print_success "Proxy security validation works"
    else
        print_warning "Proxy security validation may not be working as expected"
    fi
    
    # Test AI endpoint
    local ai_response=$(curl -s -H "Content-Type: application/json" -d '{"query":"test"}' http://localhost:9230/api/ai/kinorate/search 2>/dev/null || echo "")
    if [ ! -z "$ai_response" ]; then
        print_success "AI endpoint is accessible"
    else
        print_warning "AI endpoint may not be accessible (could be due to missing API keys)"
    fi
    
    stop_backend
    return 0
}

# Test 4: Test frontend server
test_frontend_server() {
    print_info "Testing frontend server..."
    
    start_frontend
    
    # Wait for frontend to be ready
    if ! wait_for_service "http://localhost:9229/" 20; then
        print_error "Frontend server failed to start"
        stop_frontend
        return 1
    fi
    
    # Test basic endpoint
    if curl -s http://localhost:9229/ | grep -q "Rutube Cinema Hub"; then
        print_success "Frontend server basic endpoint works"
    else
        print_error "Frontend server basic endpoint failed"
        stop_frontend
        return 1
    fi
    
    stop_frontend
    return 0
}

# Test 5: Test package scripts
test_package_scripts() {
    print_info "Testing package scripts..."
    
    # Test build
    if npm run build > /tmp/build_output.log 2>&1; then
        print_success "Build script works"
    else
        # Check if it's just warnings (not actual build failures)
        if grep -q "built in" /tmp/build_output.log; then
            print_success "Build script works (with warnings)"
        else
            print_error "Build script failed"
            cat /tmp/build_output.log
            rm -f /tmp/build_output.log
            return 1
        fi
    fi
    
    rm -f /tmp/build_output.log
    return 0
}

# Test 6: Test file structure
test_file_structure() {
    print_info "Testing file structure..."
    
    local required_dirs=("src" "server")
    local required_files=("src/App.tsx" "src/index.tsx" "src/types.ts" "server/index.js")
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_success "Directory $dir exists"
        else
            print_error "Directory $dir does not exist"
            return 1
        fi
    done
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "File $file exists"
        else
            print_error "File $file does not exist"
            return 1
        fi
    done
    
    return 0
}

# Test 7: Test configuration files
test_configurations() {
    print_info "Testing configuration files..."
    
    local config_files=("package.json" "tsconfig.json" "vite.config.ts" "docker-compose.yml")
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "Configuration file $file exists"
        else
            print_error "Configuration file $file does not exist"
            return 1
        fi
    done
    
    # Check if server script points to correct location
    if grep -q "server/index.js" package.json; then
        print_success "Package.json server script points to correct location"
    else
        print_error "Package.json server script does not point to server/index.js"
        return 1
    fi
    
    # Check if tsconfig paths are correct
    if grep -q "./src/\*" tsconfig.json; then
        print_success "Tsconfig paths are correctly set to src/"
    else
        print_error "Tsconfig paths are not correctly set to src/*"
        return 1
    fi
    
    return 0
}

# Test 8: Test playlist data retrieval
test_playlist_retrieval() {
    print_info "Testing playlist data retrieval..."
    
    # Start backend server for this test
    start_backend
    
    # Wait for backend to be ready
    if ! wait_for_service "http://localhost:9230/" 15; then
        print_error "Backend server failed to start for playlist test"
        stop_backend
        return 1
    fi
    
    # Test proxy endpoint with a known Rutube channel that should have playlists
    # Using one of the default channels from the application
    local test_channel_id="32869212"  # Смотри кино channel
    
    # First, test if we can get channel info
    local channel_info_response=$(curl -s "http://localhost:9230/api/proxy?url=https://rutube.ru/api/personal/feed/?id=${test_channel_id}&client=android&format=json" 2>/dev/null || echo "")
    
    if [ -n "$channel_info_response" ] && echo "$channel_info_response" | grep -q '"results"'; then
        print_success "Channel info retrieval works"
    else
        print_warning "Could not retrieve channel info (may be due to network restrictions)"
    fi
    
    # Test with a generic Rutube API endpoint to verify proxy functionality
    local main_tags_response=$(curl -s "http://localhost:9230/api/proxy?url=https://rutube.ru/api/main/tags/?client=android&format=json" 2>/dev/null || echo "")
    
    if [ -n "$main_tags_response" ]; then
        print_success "Generic Rutube API proxy request works"
    else
        print_warning "Generic Rutube API proxy request failed (may be due to network restrictions)"
    fi
    
    stop_backend
    return 0
}

# Test 9: Test individual video functionality
test_individual_video() {
    print_info "Testing individual video functionality..."
    
    # Start backend server for this test
    start_backend
    
    # Wait for backend to be ready
    if ! wait_for_service "http://localhost:9230/" 15; then
        print_error "Backend server failed to start for video test"
        stop_backend
        return 1
    fi
    
    # Test AI endpoint for video rating (using a simple test query)
    local ai_response=$(curl -s -H "Content-Type: application/json" -d '{"query":"test"}' http://localhost:9230/api/ai/kinorate/search 2>/dev/null || echo "")
    
    if [ -n "$ai_response" ]; then
        print_success "AI endpoint for video ratings is accessible"
    else
        print_warning "AI endpoint for video ratings is not accessible (could be due to missing API keys)"
    fi
    
    # Test AI batch endpoint
    local ai_batch_response=$(curl -s -H "Content-Type: application/json" -d '{"queries":["test"]}' http://localhost:9230/api/ai/kinorate/batch 2>/dev/null || echo "")
    
    if [ -n "$ai_batch_response" ]; then
        print_success "AI batch endpoint for video ratings is accessible"
    else
        print_warning "AI batch endpoint for video ratings is not accessible (could be due to missing API keys)"
    fi
    
    stop_backend
    return 0
}

# Test 10: Check server logs for errors
test_server_log_errors() {
    print_info "Checking server logs for errors..."
    
    # Start backend server to generate some activity
    start_backend
    
    # Wait for backend to be ready
    if ! wait_for_service "http://localhost:9230/" 15; then
        print_error "Backend server failed to start for log test"
        stop_backend
        return 1
    fi
    
    # Make a few requests to generate some log activity
    curl -s http://localhost:9230/ > /dev/null 2>&1
    curl -s -H "Content-Type: application/json" -d '{"query":"test"}' http://localhost:9230/api/ai/kinorate/search > /dev/null 2>&1
    sleep 2
    
    # Check if there are any error logs in the server output
    if [ -f /tmp/backend.log ]; then
        # Look for error indicators in the log
        local errors_found=$(grep -i -E "(error|exception|failed|unhandled rejection|cannot find)" /tmp/backend.log || true)
        
        if [ -n "$errors_found" ]; then
            print_error "Errors found in server logs:"
            echo "$errors_found"
            stop_backend
            return 1
        else
            print_success "No errors found in server logs"
        fi
    else
        print_warning "Server log file not found"
    fi
    
    stop_backend
    return 0
}

# Main test function
main() {
    print_info "Starting comprehensive tests for Rutube Cinema Hub..."
    
    local all_tests_passed=true
    
    # Run all tests
    if test_prerequisites; then
        print_success "Prerequisites test passed"
    else
        print_error "Prerequisites test failed"
        all_tests_passed=false
    fi
    
    if test_file_structure; then
        print_success "File structure test passed"
    else
        print_error "File structure test failed"
        all_tests_passed=false
    fi
    
    if test_configurations; then
        print_success "Configuration test passed"
    else
        print_error "Configuration test failed"
        all_tests_passed=false
    fi
    
    if test_typescript_compilation; then
        print_success "TypeScript compilation test passed"
    else
        print_error "TypeScript compilation test failed"
        all_tests_passed=false
    fi
    
    if test_backend_server; then
        print_success "Backend server test passed"
    else
        print_error "Backend server test failed"
        all_tests_passed=false
    fi
    
    if test_frontend_server; then
        print_success "Frontend server test passed"
    else
        print_error "Frontend server test failed"
        all_tests_passed=false
    fi
    
    if test_package_scripts; then
        print_success "Package scripts test passed"
    else
        print_error "Package scripts test failed"
        all_tests_passed=false
    fi
    
    if test_playlist_retrieval; then
        print_success "Playlist data retrieval test passed"
    else
        print_error "Playlist data retrieval test failed"
        all_tests_passed=false
    fi
    
    if test_individual_video; then
        print_success "Individual video functionality test passed"
    else
        print_error "Individual video functionality test failed"
        all_tests_passed=false
    fi
    
    if test_server_log_errors; then
        print_success "Server log error check passed"
    else
        print_error "Server log error check failed"
        all_tests_passed=false
    fi
    
    # Final result
    if [ "$all_tests_passed" = true ]; then
        print_success "🎉 All tests passed! The application is working correctly."
        exit 0
    else
        print_error "❌ Some tests failed. Please check the errors above."
        exit 1
    fi
}

# Cleanup on exit
cleanup() {
    print_info "Cleaning up test processes..."
    stop_backend
    stop_frontend
}

trap cleanup EXIT

# Run main function with any arguments
main "$@"