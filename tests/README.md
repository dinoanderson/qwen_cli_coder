# Tests

This directory contains all test files for the Qwen CLI project.

## Structure

- `integration/` - Integration tests that test the full CLI functionality
- `api/` - API-specific tests for different providers
- `auth/` - Authentication-related tests
- `unit/` - Unit tests (located in individual package directories)

## Running Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration:all

# Run integration tests without sandbox
npm run test:integration:sandbox:none

# Run integration tests with Docker sandbox
npm run test:integration:sandbox:docker

# Run integration tests with Podman sandbox
npm run test:integration:sandbox:podman
```

## Test Categories

### Integration Tests
Full end-to-end tests that verify the CLI works correctly with real or mocked APIs.

### API Tests
Tests specific to API integrations (Qwen, Gemini, etc.) to ensure proper request/response handling.

### Auth Tests
Tests for authentication mechanisms and API key validation.

### Unit Tests
Individual component and function tests are located within each package's test directory.