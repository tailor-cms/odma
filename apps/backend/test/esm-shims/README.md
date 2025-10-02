# ESM Shims for Jest

These files provide CommonJS-compatible versions of ESM-only packages for Jest testing.

They are not test mocks but compatibility shims to work around Jest's limited ESM support.

## Files

- `app-config.js` - Shim for @app/config (internal ESM package)
- `yn.js` - Shim for yn@5.x (ESM-only npm package)

## Why are these needed?

1. Jest with ts-jest runs in CommonJS mode by default
2. Some dependencies are ESM-only and cannot be `require()`d
3. These shims provide the same functionality in CommonJS format

## Note

These are not traditional test mocks - they implement the actual functionality
of the packages they replace to ensure E2E tests behave correctly.
