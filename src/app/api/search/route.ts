import { NextRequest } from 'next/server';
import { searchBusinesses, SearchProgress } from '@/lib/search-engine';
import { insertBusiness, getBusinessCount } from '@/lib/db';
import { scanForNewsletter, simulateNewsletterScan } from '@/lib/newsletter-scanner';

// Allow up to 5 minutes for long-running searches
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      regions,
      regionIds,
      businessTypes,
      businessTypeIds,
      maxPerRegion = 200,
      useCache = true,
    } = body as {
      regions?: string[];
      regionIds?: string[];
      businessTypes?: string[];
      businessTypeIds?: string[];
      maxPerRegion?: number;
      useCache?: boolean;
    };

    const resolvedRegionIds = regions || regionIds || [];
    const resolvedBusinessTypeIds = businessTypes || businessTypeIds || [];

    if (!resolvedRegionIds.length || !resolvedBusinessTypeIds.length) {
      return new Response(
        JSON.stringify({ error: 'regions and businessTypes are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const useRealScan = !!process.env.GOOGLE_PLACES_API_KEY;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let totalNewInserted = 0;
        let newsletterCount = 0;
        let streamClosed = false;

        const send = (type: string, data: unknown) => {
          if (streamClosed) return;
          try {
            controller.enqueue(encoder.encode(JSON.stringify({ type, data }) + '\n'));
          } catch {
            streamClosed = true;
          }
        };

        // Heartbeat to keep connection alive during long scraping operations
        const heartbeat = setInterval(() => {
          send('heartbeat', { timestamp: Date.now() });
        }, 15000);

        let progressTick = 0;
        const sendProgress = (progress: SearchProgress) => {
          progressTick++;
          const totalCombinations = resolvedRegionIds.length * resolvedBusinessTypeIds.length;
          const currentCombo = progress.regionsProcessed * resolvedBusinessTypeIds.length;

          let percentage: number;
          if (currentCombo > 0 && totalCombinations > 0) {
            // Region-level progress (0-90%)
            percentage = Math.min(90, Math.round((currentCombo / totalCombinations) * 90));
          } else {
            // Parse progress from status messages like "Searching 5-7 of 120 queries"
            // or "Scraping batch 3 (12/25 found with email)..."
            const statusMsg = progress.currentRegion || '';
            const searchMatch = statusMsg.match(/(\d+)-\d+ of (\d+) queries/);
            const scrapeBatchMatch = statusMsg.match(/Scraping batch (\d+)/);
            const scrapingMatch = statusMsg.match(/Scraping (\d+) venue/);

            if (searchMatch) {
              // Search phase: 0% to 60%
              const current = parseInt(searchMatch[1], 10);
              const total = parseInt(searchMatch[2], 10);
              percentage = Math.min(60, Math.round((current / total) * 60));
            } else if (scrapingMatch || scrapeBatchMatch) {
              // Scraping phase: 60% to 90%
              percentage = Math.min(90, 60 + Math.min(30, progressTick % 100));
            } else {
              // Fallback: slow increment
              percentage = Math.min(90, Math.round(progressTick * 0.5));
            }
          }

          send('progress', {
            currentRegion: progress.currentRegion,
            currentType: progress.currentBusinessType,
            regionsProcessed: progress.regionsProcessed,
            totalRegions: resolvedRegionIds.length,
            newFound: progress.newFound,
            totalInDb: getBusinessCount(),
            errors: progress.errors.length,
            percentage,
          });
        };

        try {
          const results = await searchBusinesses(
            resolvedRegionIds,
            resolvedBusinessTypeIds,
            maxPerRegion,
            useCache,
            sendProgress,
          );

          // Scan websites for newsletter signups
          send('progress', {
            currentRegion: 'Scanning websites',
            currentType: 'newsletter detection',
            regionsProcessed: resolvedRegionIds.length,
            totalRegions: resolvedRegionIds.length,
            newFound: 0,
            totalInDb: getBusinessCount(),
            errors: 0,
            percentage: 95,
          });

          // Scan in batches of 5 to avoid overwhelming
          const scanResults: Map<number, { hasNewsletter: boolean; signals: string[] }> = new Map();
          const batchSize = 5;

          for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            const scans = await Promise.all(
              batch.map(async (r) => {
                if (useRealScan && r.website) {
                  return scanForNewsletter(r.website);
                }
                return simulateNewsletterScan();
              })
            );
            scans.forEach((scan, j) => {
              scanResults.set(i + j, scan);
              if (scan.hasNewsletter) newsletterCount++;
            });
          }

          // Insert discovered businesses into the database
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const scan = scanResults.get(i) || { hasNewsletter: false, signals: [] };
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
              hasNewsletter: scan.hasNewsletter,
              newsletterSignals: scan.signals,
              eventsUrl: (result as unknown as Record<string, unknown>).eventsUrl as string || undefined,
            });
            if (isNew) {
              totalNewInserted++;
            }
          }

          // Send results (all discovered businesses for display)
          send('results', results.map((r, i) => {
            const scan = scanResults.get(i) || { hasNewsletter: false, signals: [] };
            const eventsUrl = (r as unknown as Record<string, unknown>).eventsUrl as string || '';
            return {
              id: `${r.name}-${r.address}-${r.regionId}`,
              name: r.name,
              type: r.businessType,
              address: r.address,
              city: r.city,
              region: r.regionName,
              regionId: r.regionId,
              phone: r.phone,
              email: r.email,
              website: r.website,
              rating: r.rating,
              isNew: true,
              hasNewsletter: scan.hasNewsletter,
              newsletterSignals: scan.signals,
              eventsUrl,
            };
          }));

          // Send final summary
          send('complete', {
            regionsProcessed: resolvedRegionIds.length,
            totalRegions: resolvedRegionIds.length,
            newFound: totalNewInserted,
            totalInDb: getBusinessCount(),
            errors: 0,
            percentage: 100,
            totalDiscovered: results.length,
            duplicatesSkipped: results.length - totalNewInserted,
            withNewsletter: newsletterCount,
          });
        } catch (err) {
          send('error', {
            message: err instanceof Error ? err.message : String(err),
            newFound: totalNewInserted,
            totalInDb: getBusinessCount(),
          });
        } finally {
          clearInterval(heartbeat);
          if (!streamClosed) {
            try { controller.close(); } catch { /* already closed */ }
          }
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
