# Error Boundaries

React Error Boundaries catch JavaScript errors in component trees and display fallback UI instead of crashing the entire app.

## Components

### `ErrorBoundary`
Base error boundary component with customizable fallback UI.

```tsx
import { ErrorBoundary } from '@/components/error-boundaries';

<ErrorBoundary fallback={<CustomError />}>
  <MyComponent />
</ErrorBoundary>
```

### `PageErrorBoundary`
Wraps entire pages to catch all errors.

```tsx
import { PageErrorBoundary } from '@/components/error-boundaries';

export default function MyPage() {
  return (
    <PageErrorBoundary>
      <PageContent />
    </PageErrorBoundary>
  );
}
```

### `ComponentErrorBoundary`
Wraps individual components with lightweight fallback.

```tsx
import { ComponentErrorBoundary } from '@/components/error-boundaries';

<ComponentErrorBoundary componentName="Chat Widget">
  <ChatWidget />
</ComponentErrorBoundary>
```

## Usage Examples

### Layout-level (Catch all errors)

```tsx
// app/[locale]/layout.tsx
import { PageErrorBoundary } from '@/components/error-boundaries';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PageErrorBoundary>
          {children}
        </PageErrorBoundary>
      </body>
    </html>
  );
}
```

### Page-level

```tsx
// app/[locale]/inbox/page.tsx
import { PageErrorBoundary } from '@/components/error-boundaries';

export default function InboxPage() {
  return (
    <PageErrorBoundary>
      <InboxLayout>
        <ConversationList />
        <MessageView />
      </InboxLayout>
    </PageErrorBoundary>
  );
}
```

### Component-level (Isolated failure)

```tsx
// components/chat/message-list.tsx
import { ComponentErrorBoundary } from '@/components/error-boundaries';

export function MessageList() {
  return (
    <div>
      <ComponentErrorBoundary componentName="Message List">
        <Messages />
      </ComponentErrorBoundary>

      <ComponentErrorBoundary componentName="Typing Indicator">
        <TypingIndicator />
      </ComponentErrorBoundary>
    </div>
  );
}
```

### Custom fallback UI

```tsx
import { ErrorBoundary } from '@/components/error-boundaries';

function CustomErrorFallback() {
  return (
    <div className="p-4 text-center">
      <h2>Oops! Something went wrong</h2>
      <button onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}

<ErrorBoundary fallback={<CustomErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>
```

### With error logging

```tsx
import { ErrorBoundary } from '@/components/error-boundaries';
import * as Sentry from '@sentry/nextjs';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    Sentry.captureException(error, {
      contexts: { react: errorInfo },
    });

    // Log to analytics
    analytics.track('Error Occurred', {
      error: error.message,
      component: errorInfo.componentStack,
    });
  }}
>
  <App />
</ErrorBoundary>
```

## Best Practices

### 1. Multiple boundaries for isolation

Don't wrap the entire app in one boundary. Use multiple boundaries to isolate failures:

```tsx
<PageErrorBoundary>
  <Header />

  <ComponentErrorBoundary>
    <Sidebar />
  </ComponentErrorBoundary>

  <ComponentErrorBoundary>
    <MainContent />
  </ComponentErrorBoundary>
</PageErrorBoundary>
```

### 2. Strategic placement

- **Page-level**: Catch routing/page load errors
- **Feature-level**: Isolate complex features (chat, analytics)
- **Component-level**: Non-critical widgets (notifications, tooltips)

### 3. Avoid boundaries for:

- Event handlers (use try/catch)
- Async code (use error states)
- Server components (use error.tsx in Next.js)

```tsx
// ❌ Don't do this
<ErrorBoundary>
  <button onClick={() => riskyOperation()}>Click</button>
</ErrorBoundary>

// ✅ Do this instead
<button onClick={async () => {
  try {
    await riskyOperation();
  } catch (error) {
    setError(error);
  }
}}>
  Click
</button>
```

### 4. Development vs Production

- **Development**: Show detailed error messages
- **Production**: Hide stack traces, log to external service

```tsx
{process.env.NODE_ENV === 'development' && (
  <pre>{error.stack}</pre>
)}
```

### 5. Recovery actions

Provide users with recovery options:

```tsx
<ErrorBoundary
  fallback={
    <div>
      <p>Error occurred</p>
      <button onClick={() => window.location.reload()}>
        Refresh
      </button>
      <button onClick={() => router.push('/')}>
        Go Home
      </button>
      <button onClick={clearCache}>
        Clear Cache
      </button>
    </div>
  }
>
  <App />
</ErrorBoundary>
```

## Error Tracking Integration

### Sentry

```bash
npm install @sentry/nextjs
```

```tsx
import * as Sentry from '@sentry/nextjs';

<ErrorBoundary
  onError={(error, errorInfo) => {
    Sentry.captureException(error, {
      contexts: { react: errorInfo },
    });
  }}
>
  <App />
</ErrorBoundary>
```

### LogRocket

```bash
npm install logrocket
```

```tsx
import LogRocket from 'logrocket';

<ErrorBoundary
  onError={(error) => {
    LogRocket.captureException(error);
  }}
>
  <App />
</ErrorBoundary>
```

## Next.js 13+ App Router

Next.js provides built-in error handling:

- `error.tsx`: Catches runtime errors in route segments
- `global-error.tsx`: Catches errors in root layout
- `not-found.tsx`: Handles 404 errors

Use React Error Boundaries for **client component** errors:

```tsx
// app/[locale]/inbox/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Testing Error Boundaries

```tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundaries';

function ThrowError() {
  throw new Error('Test error');
}

test('catches errors and displays fallback', () => {
  render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText('Error occurred')).toBeInTheDocument();
});
```

## References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
