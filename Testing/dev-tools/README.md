# Development Tools

This folder contains development and testing tools that were removed from the production codebase.

## Files Moved Here

### Components
- **AITestButton.jsx** - AI testing component for debugging AI service functionality
- **StateManagementDebugger.jsx** - Real-time state management debugging component

### Utilities
- **dashboardTest.js** - Dashboard connection testing utilities
- **stateManagementTest.js** - State management system testing utilities

## Usage

These tools were originally integrated into the UserDashboard and AI components for development purposes. They have been moved here to keep the production codebase clean while preserving the testing functionality for future development needs.

## Integration

If you need to use these tools again during development:

1. **AITestButton**: Import and add to any component for AI service testing
2. **StateManagementDebugger**: Import and add to components for state debugging
3. **dashboardTest.js**: Import test functions for dashboard connectivity testing
4. **stateManagementTest.js**: Import test functions for state management testing

## Notes

- These tools were removed from production to improve performance and user experience
- They can be temporarily re-integrated during development cycles
- All tools maintain their original functionality when imported
