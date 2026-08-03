import { Skeleton } from '@/components/ui/skeleton';

export default function TodayLoading(): React.JSX.Element {
  return <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:px-6 lg:px-8"><Skeleton className="h-24 w-full" /><Skeleton className="h-36 w-full" /><Skeleton className="h-48 w-full" /></main>;
}
