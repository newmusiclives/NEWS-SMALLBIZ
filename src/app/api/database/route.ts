import { NextRequest, NextResponse } from 'next/server';
import { getBusinessCount, getRegionSummaries, clearRegion, clearAll } from '@/lib/db';

export async function GET() {
  try {
    const totalBusinesses = getBusinessCount();
    const regionSummaries = getRegionSummaries();
    const totalRegions = regionSummaries.length;

    // Count distinct business types from region summaries
    const businessTypes = new Set(regionSummaries.map((r) => r.regionId)).size;

    const regions = regionSummaries.map((r) => ({
      id: r.regionId,
      name: r.regionName,
      country: r.country,
      countryCode: r.country,
      businessCount: r.businessCount,
      lastUpdated: r.lastUpdated || '',
    }));

    return NextResponse.json({
      totalBusinesses,
      totalRegions,
      businessTypes,
      regions,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');

    if (regionId) {
      const deleted = clearRegion(regionId);
      return NextResponse.json({ deleted });
    } else {
      const deleted = clearAll();
      return NextResponse.json({ deleted });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
