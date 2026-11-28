'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function RetryDatabaseButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="primary-button retry-button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {isPending ? 'Trying again…' : 'Retry database connection'}
    </button>
  );
}
