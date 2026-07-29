import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Recovery First</h1>
      <p>Build habits that can recover when life changes.</p>
      <Link href="/app">Open application shell</Link>
    </main>
  );
}
