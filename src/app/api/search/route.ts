import { NextRequest } from 'next/server';
import { searchBusinesses, SearchProgress } from '@/lib/search-engine';
import { insertBusiness, getBusinessCount } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      regionIds,
      businessTypeIds,
      maxPerRegion = 200,
      useCache = true,
    } = body as {
      regionIds: string[];
      businessTypeIds: string[];
      maxPerRegion?: number;
      useCache?: boolean;
    };

    if (!regionIds?.length || !businessTypeIds?.length) {
      return new Response(
        JSON.stringify({ error: 'regionIds and businessTypeIds are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let totalNewInserted = 0;

        const sendProgress = (progress: SearchProgress) => {
          const enriched = {
            ...progress,
            totalInDb: getBusinessCount(),
          };
          controller.enqueue(encoder.encode(JSON.stringify(enriched) + '\n'));
        };

        try {
          const results = await searchBusinesses(
            regionIds,
            businessTypeIds,
            maxPerRegion,
            useCache,
            sendProgress,
          );

          // Insert discovered businesses into the database
          for (const result of results) {
            const isNew = insertBusiness({
              name: result.name,
              businessType: result.businessType,
              address: result.address,
              city: result.city,
              regionId: result.regionId,
              regionName: result.regionName,
              country: result.country,
              phone: result.phone,
              email: result.email,
              website: result.website,
              rating: result.rating,
              reviewCount: result.reviewCount,
              source: result.source,
            });
            if (isNew) totalNewInserted++;
          }

          // Send final summary
          const summary = {
            status: 'completed' as const,
            currentRegion: '',
            currentBusinessType: '',
            regionsProcessed: regionIds.length,
            totalRegions: regionIds.length,
            newFound: totalNewInserted,
            totalInDb: getBusinessCount(),
            elapsedMs: 0,
            errors: [],
            summary: {
              totalDiscovered: results.length,
              newInserted: totalNewInserted,
              duplicatesSkipped: results.length - totalNewInserted,
            },
          };
          controller.enqueue(encoder.encode(JSON.stringify(summary) + '\n'));
        } catch (err) {
          const errorProgress: SearchProgress = {
            currentRegion: '',
            currentBusinessType: '',
            regionsProcessed: 0,
            totalRegions: regionIds.length,
            newFound: totalNewInserted,
            totalInDb: getBusinessCount(),
            elapsedMs: 0,
            status: 'error',
            errors: [err instanceof Error ? err.message : String(err)],
          };
          controller.enqueue(encoder.encode(JSON.stringify(errorProgress) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
