import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ComingSoon from '@/components/ComingSoon';

export default async function StoreTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  const store = await prisma.store.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!store) {
    notFound();
  }

  return (
    <ComingSoon
      title="Timeline"
      description="Visual timeline of store launch milestones"
      backLink={`/dashboard/stores/${id}`}
    />
  );
}
