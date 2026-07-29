'use client';

export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <html lang="en">
      <body>
        <main role="alert">
          <h1>Recovery First is temporarily unavailable</h1>
          <button type="button" onClick={reset}>
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
