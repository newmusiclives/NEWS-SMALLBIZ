import { NextRequest } from 'next/server';
import { searchBusinesses } from '@/lib/search-engine';
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
      city,
    } = body as {
      regions?: string[];
      regionIds?: string[];
      businessTypes?: string[];
      businessTypeIds?: string[];
      maxPerRegion?: number;
      useCache?: boolean;
      city?: string;
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

    const results = await searchBusinesses(
      resolvedRegionIds,
      resolvedBusinessTypeIds,
      maxPerRegion,
      useCache,
      () => {},
      city,
    );

    // Newsletter scanning (skip on serverless to avoid timeouts)
    const scanResults: Map<number, { hasNewsletter: boolean; signals: string[] }> = new Map();
    let newsletterCount = 0;
    const isServerless = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (!isServerless) {
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
    }

    // Try inserting into local DB (won't work on Netlify serverless — that's OK)
    let totalNewInserted = 0;
    let totalInDb = 0;
    try {
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
        if (isNew) totalNewInserted++;
      }
      totalInDb = getBusinessCount();
    } catch {
      // DB not available — skip insert, still return search results
      totalNewInserted = results.length;
    }

    const businessResults = results.map((r, i) => {
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
    });

    return new Response(
      JSON.stringify({
        results: businessResults,
        summary: {
          regionsProcessed: resolvedRegionIds.length,
          totalRegions: resolvedRegionIds.length,
          newFound: totalNewInserted,
          totalInDb,
          errors: 0,
          percentage: 100,
          totalDiscovered: results.length,
          duplicatesSkipped: results.length - totalNewInserted,
          withNewsletter: newsletterCount,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
