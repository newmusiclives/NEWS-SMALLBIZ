import { NextRequest, NextResponse } from 'next/server';
import { getBusinesses, getBusinessCount, clearRegion, clearAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId') || undefined;
    const businessType = searchParams.get('businessType') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const newOnly = searchParams.get('newOnly') === 'true';

    const businesses = getBusinesses({
      regionId,
      businessType,
      search,
      newOnly,
      limit,
      offset,
    });

    const total = getBusinessCount(regionId, businessType);

    return NextResponse.json({ businesses, total });
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

    let deleted: number;
    if (regionId) {
      deleted = clearRegion(regionId);
    } else {
      deleted = clearAll();
    }

    return NextResponse.json({ deleted, message: `Deleted ${deleted} businesses` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
