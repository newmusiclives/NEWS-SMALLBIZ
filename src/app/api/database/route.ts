import { NextResponse } from 'next/server';
import { getBusinessCount, getRegionSummaries } from '@/lib/db';

export async function GET() {
  try {
    const totalBusinesses = getBusinessCount();
    const regionSummaries = getRegionSummaries();
    const totalRegions = regionSummaries.length;

    const lastUpdated =
      regionSummaries.length > 0
        ? regionSummaries.reduce((latest, r) => {
            if (!r.lastUpdated) return latest;
            if (!latest) return r.lastUpdated;
            return r.lastUpdated > latest ? r.lastUpdated : latest;
          }, '' as string)
        : null;

    return NextResponse.json({
      totalBusinesses,
      totalRegions,
      regionSummaries,
      lastUpdated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
