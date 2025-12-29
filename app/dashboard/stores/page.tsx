import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import StoreCard from '@/components/StoreCard';
import StoreFilters from '@/components/StoreFilters';
import { Plus } from 'lucide-react';

interface SearchParams {
  country?: string;
  status?: string;
  search?: string;
}

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const where: any = {};

  if (params.country) {
    where.country = params.country;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { tempName: { contains: params.search } },
      { officialName: { contains: params.search } },
      { city: { contains: params.search } },
    ];
  }

  const [stores, countries] = await Promise.all([
    prisma.store.findMany({
      where,
      include: {
        plannedOpenDates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.country.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
          <p className="text-gray-600 mt-2">
            Manage your store launches across all countries
          </p>
        </div>
        <Link
          href="/dashboard/stores/new"
          className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Store
        </Link>
      </div>

      <StoreFilters countries={countries} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stores.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No stores found
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first store.
            </p>
            <Link
              href="/dashboard/stores/new"
              className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Store
            </Link>
          </div>
        ) : (
          stores.map((store) => <StoreCard key={store.id} store={store} />)
        )}
      </div>
    </div>
  );
}
