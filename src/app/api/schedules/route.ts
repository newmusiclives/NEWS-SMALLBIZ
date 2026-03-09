import { NextRequest, NextResponse } from 'next/server';
import { createSchedule, getSchedules, updateSchedule, deleteSchedule } from '@/lib/db';

export async function GET() {
  try {
    const schedules = getSchedules();
    return NextResponse.json({ schedules });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, regionIds, businessTypeIds, frequency, maxPerRegion, nextRun } = body as {
      name: string;
      regionIds: string[];
      businessTypeIds: string[];
      frequency: 'weekly' | 'biweekly' | 'monthly';
      maxPerRegion?: number;
      nextRun?: string;
    };

    if (!name || !regionIds?.length || !businessTypeIds?.length || !frequency) {
      return NextResponse.json(
        { error: 'name, regionIds, businessTypeIds, and frequency are required' },
        { status: 400 },
      );
    }

    const validFrequencies = ['weekly', 'biweekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `frequency must be one of: ${validFrequencies.join(', ')}` },
        { status: 400 },
      );
    }

    const schedule = createSchedule({ name, regionIds, businessTypeIds, frequency, maxPerRegion, nextRun });
    return NextResponse.json({ schedule }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body as {
      id: string;
      name?: string;
      regionIds?: string[];
      businessTypeIds?: string[];
      frequency?: string;
      maxPerRegion?: number;
      isActive?: number;
      lastRun?: string;
      nextRun?: string;
      runHistory?: unknown[];
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const success = updateSchedule(id, updates);
    if (!success) {
      return NextResponse.json({ error: 'Schedule not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Schedule updated' });
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    const success = deleteSchedule(id);
    if (!success) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Schedule deleted' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
