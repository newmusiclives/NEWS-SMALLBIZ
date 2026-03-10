export interface SearchResult {
  name: string;
  businessType: string;
  address: string;
  city: string;
  regionId: string;
  regionName: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  rating: number | null;
  reviewCount: number;
  source: string;
  eventsUrl?: string;
}

export interface SearchProgress {
  currentRegion: string;
  currentBusinessType: string;
  regionsProcessed: number;
  totalRegions: number;
  newFound: number;
  totalInDb: number;
  elapsedMs: number;
  status: 'searching' | 'completed' | 'error' | 'cancelled';
  errors: string[];
}

// Region metadata for generating realistic data
const REGION_INFO: Record<string, { name: string; country: string; cities: string[]; areaCode: string; streets: string[] }> = {
  'us-ca': {
    name: 'California',
    country: 'US',
    cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno', 'Oakland', 'Long Beach'],
    areaCode: '310',
    streets: ['Main St', 'Oak Ave', 'Sunset Blvd', 'Pacific Hwy', 'Mission St', 'El Camino Real', 'Broadway', 'Harbor Blvd'],
  },
  'us-ny': {
    name: 'New York',
    country: 'US',
    cities: ['New York', 'Brooklyn', 'Queens', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers'],
    areaCode: '212',
    streets: ['Broadway', 'Madison Ave', 'Park Ave', 'Lexington Ave', 'Amsterdam Ave', 'Columbus Ave', 'Canal St', 'Houston St'],
  },
  'us-tx': {
    name: 'Texas',
    country: 'US',
    cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Plano'],
    areaCode: '713',
    streets: ['Main St', 'Travis St', 'Westheimer Rd', 'Highway 6', 'Lamar Blvd', 'Congress Ave', 'Commerce St', 'Elm St'],
  },
  'us-fl': {
    name: 'Florida',
    country: 'US',
    cities: ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Lauderdale', 'St Petersburg', 'Hialeah', 'Tallahassee'],
    areaCode: '305',
    streets: ['Ocean Dr', 'Collins Ave', 'Biscayne Blvd', 'Flagler St', 'International Dr', 'Palm Ave', 'Bayshore Blvd', 'Gulf Blvd'],
  },
  'us-il': {
    name: 'Illinois',
    country: 'US',
    cities: ['Chicago', 'Springfield', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Elgin', 'Peoria'],
    areaCode: '312',
    streets: ['Michigan Ave', 'State St', 'Lake Shore Dr', 'Clark St', 'Halsted St', 'Western Ave', 'Ashland Ave', 'Damen Ave'],
  },
  'uk-london': {
    name: 'London',
    country: 'UK',
    cities: ['Westminster', 'Camden', 'Greenwich', 'Hackney', 'Islington', 'Kensington', 'Lambeth', 'Southwark'],
    areaCode: '020',
    streets: ['High St', 'Church Rd', 'King St', 'Queen St', 'Victoria Rd', 'Station Rd', 'Park Lane', 'Baker St'],
  },
  'uk-manchester': {
    name: 'Manchester',
    country: 'UK',
    cities: ['Manchester', 'Salford', 'Stockport', 'Bolton', 'Bury', 'Oldham', 'Rochdale', 'Wigan'],
    areaCode: '0161',
    streets: ['Deansgate', 'Market St', 'Oxford Rd', 'Portland St', 'Cross St', 'King St', 'Bridge St', 'Chapel St'],
  },
  'ca-on': {
    name: 'Ontario',
    country: 'CA',
    cities: ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton', 'London', 'Brampton', 'Markham', 'Kitchener'],
    areaCode: '416',
    streets: ['Yonge St', 'Queen St', 'King St', 'Bloor St', 'Dundas St', 'College St', 'Bay St', 'Front St'],
  },
  'au-nsw': {
    name: 'New South Wales',
    country: 'AU',
    cities: ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Parramatta', 'Penrith', 'Liverpool', 'Campbelltown'],
    areaCode: '02',
    streets: ['George St', 'Pitt St', 'Oxford St', 'Crown St', 'King St', 'Hunter St', 'Church St', 'Victoria Ave'],
  },
};

// Business name templates
const NAME_TEMPLATES: Record<string, string[]> = {
  plumber: [
    "{last}'s Plumbing", "All-Pro Plumbing", "{city} Plumbing Co", "Reliable Plumbing Services",
    "A-1 Plumbing", "Express Plumbing", "Master Plumbers Inc", "{last} & Sons Plumbing",
    "Aqua Flow Plumbing", "RotoPlumb Services", "Premier Plumbing Solutions", "DrainMaster Plumbing",
    "Pipeline Plumbing", "Blue Water Plumbing", "QuickFix Plumbing",
  ],
  electrician: [
    "{last} Electric", "Bright Spark Electrical", "{city} Electric Co", "PowerLine Electrical",
    "A+ Electrical Services", "Current Electric", "Volt Masters Inc", "{last} & Associates Electric",
    "Premier Electric Co", "Wired Right Electrical", "Surge Electrical Services", "AmpUp Electric",
    "Circuit Pro Electric", "TrueWatt Electric", "Beacon Electrical",
  ],
  hvac: [
    "{last}'s HVAC", "Cool Comfort HVAC", "{city} Heating & Air", "All Seasons HVAC",
    "Climate Control Systems", "AirTech HVAC", "ComfortZone Heating", "{last} Air Conditioning",
    "ThermoMax HVAC", "Arctic Air Services", "Precision Climate", "EcoAir HVAC Solutions",
    "FreshAir Heating & Cooling", "BreezeTech HVAC", "Summit HVAC",
  ],
  landscaper: [
    "{last}'s Landscaping", "Green Thumb Landscaping", "{city} Lawn & Garden", "Nature's Edge Landscaping",
    "Premier Landscapes", "TurfMaster Lawn Care", "EverGreen Services", "{last} Landscape Design",
    "Botanical Gardens Inc", "Lawn Perfect Landscaping", "GreenScape Pro", "Earth & Stone Landscapes",
    "WildFlower Landscaping", "SunRise Lawn Services", "NatureCraft Landscapes",
  ],
  roofer: [
    "{last}'s Roofing", "Top Notch Roofing", "{city} Roofing Co", "Apex Roofing Services",
    "ShingleMaster Roofing", "AllWeather Roofing", "Summit Roofing", "{last} & Sons Roofing",
    "SkyHigh Roofing", "StormGuard Roofing", "TrueTop Roofing", "PeakView Roofing",
    "IronClad Roofing", "ProShield Roofing", "Heritage Roofing",
  ],
  painter: [
    "{last}'s Painting", "Pro Coat Painters", "{city} Painting Co", "ColorMaster Painting",
    "Fresh Coat Painting", "Precision Painting", "BrushStroke Painters", "{last} Paint & Design",
    "Accent Painting Services", "TrueColor Painters", "Premier Paint Pros", "WallCraft Painting",
    "ArtisanCoat Painters", "PaintRight Services", "Spectrum Painting",
  ],
  carpenter: [
    "{last}'s Carpentry", "Master Woodworks", "{city} Carpentry Co", "Fine Craft Carpentry",
    "Timber Built Services", "WoodWise Carpentry", "HandCraft Woodworking", "{last} Custom Carpentry",
    "Precision Woodcraft", "Sawmill Carpentry", "OakTree Carpentry", "TrueJoint Woodworks",
    "ArtWood Carpentry", "SquareEdge Builders", "Heritage Woodcraft",
  ],
  locksmith: [
    "{last}'s Locksmith", "24/7 Lock & Key", "{city} Locksmith Co", "SecureLock Services",
    "KeyMaster Locksmith", "FastKey Locksmith", "SafeGuard Lock Co", "{last} Security Locks",
    "AllAccess Locksmith", "TurnKey Lock Services", "BoltRight Locksmith", "ProLock Solutions",
    "IronGate Locksmith", "QuickLock Services", "TrustKey Locksmith",
  ],
};

const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Nelson',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBusinessName(businessType: string, city: string): string {
  const templates = NAME_TEMPLATES[businessType] || NAME_TEMPLATES.plumber;
  const template = randomPick(templates);
  const last = randomPick(LAST_NAMES);
  return template.replace('{last}', last).replace('{city}', city);
}

function generatePhone(areaCode: string): string {
  return `(${areaCode}) ${randomInt(200, 999)}-${String(randomInt(1000, 9999))}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateEmail(businessName: string): string {
  const slug = slugify(businessName);
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  // 60% chance of custom domain, 40% chance of generic
  if (Math.random() < 0.6) {
    return `info@${slug}.com`;
  }
  return `${slug}@${randomPick(domains)}`;
}

function generateWebsite(businessName: string): string {
  const slug = slugify(businessName);
  return `https://www.${slug}.com`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDefaultRegionInfo(regionId: string): {
  name: string;
  country: string;
  cities: string[];
  areaCode: string;
  streets: string[];
} {
  return {
    name: regionId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    country: regionId.split('-')[0].toUpperCase(),
    cities: ['Downtown', 'Midtown', 'Eastside', 'Westside', 'Northgate'],
    areaCode: '555',
    streets: ['Main St', 'Oak Ave', 'Elm St', 'Park Rd', 'Center Blvd'],
  };
}

async function simulateSearch(
  regionId: string,
  businessType: string,
): Promise<SearchResult[]> {
  const info = REGION_INFO[regionId] || getDefaultRegionInfo(regionId);
  const count = randomInt(5, 20);
  const results: SearchResult[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const city = randomPick(info.cities);
    let name = generateBusinessName(businessType, city);

    // Ensure unique names
    let attempts = 0;
    while (usedNames.has(name) && attempts < 10) {
      name = generateBusinessName(businessType, city);
      attempts++;
    }
    usedNames.add(name);

    const streetNum = randomInt(100, 9999);
    const street = randomPick(info.streets);

    results.push({
      name,
      businessType,
      address: `${streetNum} ${street}`,
      city,
      regionId,
      regionName: info.name,
      country: info.country,
      phone: generatePhone(info.areaCode),
      email: generateEmail(name),
      website: generateWebsite(name),
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviewCount: randomInt(5, 500),
      source: randomPick(['google', 'yelp', 'yellowpages', 'bbb']),
    });
  }

  // Simulate network delay
  await delay(randomInt(100, 500));

  return results;
}

async function searchGooglePlaces(
  regionId: string,
  businessType: string,
  regionName: string,
  apiKey: string,
  maxResults: number,
): Promise<SearchResult[]> {
  const query = `${businessType} in ${regionName}`;
  const fieldMask = [
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.rating',
    'places.userRatingCount',
    'places.primaryType',
  ].join(',');

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: Math.min(maxResults, 20),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const places = data.places || [];
  const regionParts = regionId.split('-');
  const country = regionParts[0]?.toUpperCase() || 'US';

  return places.map((place: Record<string, unknown>): SearchResult => {
    const displayName = place.displayName as { text?: string } | undefined;
    const name = displayName?.text || 'Unknown Business';
    const address = (place.formattedAddress as string) || '';
    const addressParts = address.split(',');
    const city = addressParts.length > 1 ? addressParts[addressParts.length - 3]?.trim() || '' : '';

    return {
      name,
      businessType,
      address,
      city,
      regionId,
      regionName,
      country,
      phone: (place.nationalPhoneNumber as string) || '',
      email: '',
      website: (place.websiteUri as string) || '',
      rating: (place.rating as number) || null,
      reviewCount: (place.userRatingCount as number) || 0,
      source: 'google_places',
    };
  });
}

export async function searchBusinesses(
  regionIds: string[],
  businessTypeIds: string[],
  maxPerRegion: number,
  _useCache: boolean,
  onProgress: (progress: SearchProgress) => void,
): Promise<SearchResult[]> {
  const { searchBusinessesWeb } = await import('./web-scraper');
  const { BUSINESS_TYPES } = await import('./business-types');
  const { REGION_CATEGORIES } = await import('./regions');

  // Build lookup maps
  const bizTypeMap = new Map(BUSINESS_TYPES.map((t) => [t.id, t]));
  const regionMap = new Map<string, { name: string; country: string }>();
  for (const cat of REGION_CATEGORIES) {
    for (const r of cat.regions) {
      regionMap.set(r.id, { name: r.name, country: r.country });
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const startTime = Date.now();
  const allResults: SearchResult[] = [];
  const errors: string[] = [];
  let regionsProcessed = 0;
  let newFound = 0;

  for (const regionId of regionIds) {
    const regionInfo = regionMap.get(regionId) ||
      REGION_INFO[regionId] ||
      getDefaultRegionInfo(regionId);

    for (const businessType of businessTypeIds) {
      const bizType = bizTypeMap.get(businessType);
      const bizName = bizType?.name || businessType;

      onProgress({
        currentRegion: regionInfo.name,
        currentBusinessType: bizName,
        regionsProcessed,
        totalRegions: regionIds.length,
        newFound,
        totalInDb: allResults.length,
        elapsedMs: Date.now() - startTime,
        status: 'searching',
        errors,
      });

      try {
        let results: SearchResult[];

        if (apiKey) {
          // Google Places API if key is available
          results = await searchGooglePlaces(
            regionId,
            businessType,
            regionInfo.name,
            apiKey,
            maxPerRegion,
          );
        } else {
          // Web scraping — DuckDuckGo (no API key needed)
          const webResults = await searchBusinessesWeb(
            regionId,
            regionInfo.name,
            regionInfo.country,
            businessType,
            bizName,
            maxPerRegion,
            (statusMsg) => {
              onProgress({
                currentRegion: statusMsg,
                currentBusinessType: bizName,
                regionsProcessed,
                totalRegions: regionIds.length,
                newFound,
                totalInDb: allResults.length,
                elapsedMs: Date.now() - startTime,
                status: 'searching',
                errors,
              });
            },
          );

          results = webResults.map((r) => ({
            name: r.name,
            businessType: r.businessType,
            address: r.address,
            city: r.city,
            regionId: r.regionId,
            regionName: r.regionName,
            country: r.country,
            phone: r.phone,
            email: r.email,
            website: r.website,
            rating: r.rating,
            reviewCount: r.reviewCount,
            source: r.source,
            eventsUrl: r.eventsUrl || undefined,
          }));
        }

        // Cap results per region
        if (results.length > maxPerRegion) {
          results = results.slice(0, maxPerRegion);
        }

        allResults.push(...results);
        newFound += results.length;
      } catch (err) {
        const errorMsg = `Error searching ${bizName} in ${regionInfo.name}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(errorMsg);
      }
    }

    regionsProcessed++;
  }

  onProgress({
    currentRegion: '',
    currentBusinessType: '',
    regionsProcessed: regionIds.length,
    totalRegions: regionIds.length,
    newFound,
    totalInDb: allResults.length,
    elapsedMs: Date.now() - startTime,
    status: errors.length > 0 && allResults.length === 0 ? 'error' : 'completed',
    errors,
  });

  return allResults;
}
