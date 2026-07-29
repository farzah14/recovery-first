'use client';

export default function RouteError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main role="alert">
      <h1>Something went wrong</h1>
      <p>The page could not be displayed.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
