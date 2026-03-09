import { NextRequest } from 'next/server';
import { getBusinesses } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const regionId = searchParams.get('regionId') || undefined;
    const newOnly = searchParams.get('newOnly') === 'true';

    const businesses = getBusinesses({
      regionId,
      newOnly,
      limit: 100000,
      offset: 0,
    });

    const rows = businesses.map((b) => ({
      Name: b.name,
      Type: b.business_type,
      Address: b.address || '',
      City: b.city || '',
      Region: b.region_name,
      Country: b.country,
      Phone: b.phone || '',
      Email: b.email || '',
      Website: b.website || '',
      Rating: b.rating ?? '',
      Reviews: b.review_count,
      Source: b.source,
      Discovered: b.discovered_at,
    }));

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 15 }, // Type
        { wch: 30 }, // Address
        { wch: 15 }, // City
        { wch: 15 }, // Region
        { wch: 8 },  // Country
        { wch: 18 }, // Phone
        { wch: 30 }, // Email
        { wch: 30 }, // Website
        { wch: 8 },  // Rating
        { wch: 10 }, // Reviews
        { wch: 12 }, // Source
        { wch: 22 }, // Discovered
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Businesses');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const filename = regionId
        ? `businesses-${regionId}-${new Date().toISOString().split('T')[0]}.xlsx`
        : `businesses-all-${new Date().toISOString().split('T')[0]}.xlsx`;

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // CSV format
    const columns = ['Name', 'Type', 'Address', 'City', 'Region', 'Country', 'Phone', 'Email', 'Website', 'Rating', 'Reviews', 'Source', 'Discovered'];

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines: string[] = [columns.join(',')];
    for (const row of rows) {
      const values = columns.map((col) => escapeCsv(row[col as keyof typeof row]));
      csvLines.push(values.join(','));
    }
    const csvContent = csvLines.join('\n');

    const filename = regionId
      ? `businesses-${regionId}-${new Date().toISOString().split('T')[0]}.csv`
      : `businesses-all-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
