import Link from 'next/link';

export const metadata = {
  title: 'Application',
};

export default function ApplicationPage() {
  return (
    <main>
      <h1>Application foundation</h1>
      <p>Your habit workspace starts here.</p>
      <Link href="/">Return to public site</Link>
    </main>
  );
}
