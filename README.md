# Operations Management Dashboard

A responsive dashboard for monitoring and managing operational records, built with React and Vite. The project demonstrates data management, asynchronous request handling, and error recovery using a mock API.

## Features

- **Operations Overview:** Summary statistics for Pending, Running, Completed, and Failed operations.
- **Operations Table:** View operational records and their status and date information.
- **Search:** Search by operation name or ID.
- **Filtering:** Filter operations by status and combine filters with search.
- **Sorting and Pagination:** Organize results and navigate between pages.
- **Operation Details:** View additional operation information in a details drawer.
- **Status Management:** Update operation statuses using optimistic updates and rollback on failure.
- **Async Request Handling:** Loading and error states, retries, request cancellation, and protection against stale search results.
- **Failure Simulation:** Simulate API latency and intermittent failures to test error handling and recovery.

## Tech Stack

- React 19
- JavaScript (JSX)
- Vite 8
- Tailwind CSS v4
- TanStack React Query
- React Router
- Lucide React
- Vitest
- React Testing Library
- ESLint

## Prerequisites

- Node.js
- npm

## Installation

Install the project dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Available Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the development server         |
| `npm test`           | Run the automated tests once         |
| `npm run test:watch` | Run tests in watch mode              |
| `npm run lint`       | Run ESLint                           |
| `npm run build`      | Create a production build            |
| `npm run preview`    | Preview the production build locally |

## Mock API and Data

The dashboard uses a mock API with **5,200 generated operational records**. The mock implementation supports search, filtering, sorting, and pagination without requiring a real backend.

API requests simulate variable latency and intermittent failures. This helps test loading states, error handling, retry behavior, and asynchronous request management.

Status updates use optimistic UI updates to provide immediate feedback. If an update fails, the previous state is restored. Relevant cached lists, operation details, and summary statistics are synchronized as implemented.

## Testing

The test suite covers dashboard rendering, searching, combined filters, sorting, pagination, status statistics, status updates, rollback behavior, API errors and retries, operation details, and asynchronous request race conditions.

The latest reported test run passed **17 of 17 tests**. Run `npm test` to verify the current project state.

## Note

This project uses mock data and simulated API behavior for demonstration and testing; it does not represent a connection to a production backend.
