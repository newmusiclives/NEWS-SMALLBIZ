/**
 * Web search and scraping engine for finding real businesses.
 * Uses free search engines (Brave, DuckDuckGo) — no API keys required.
 * For venue types: searches by city, scrapes "best of" list articles for names,
 * then finds each venue's website individually.
 */

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const REQUEST_DELAY = 1000; // 1s between requests to avoid rate limiting

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface ScrapedBusiness {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  eventsUrl: string;
  capacity: number | null;
}

// ─── Cities by Region ────────────────────────────────────────────────────────

const REGION_CITIES: Record<string, string[]> = {
  'Alabama': ['Birmingham', 'Huntsville', 'Mobile', 'Montgomery', 'Tuscaloosa', 'Auburn', 'Florence', 'Dothan', 'Hoover', 'Decatur', 'Madison', 'Gadsden', 'Vestavia Hills', 'Prattville', 'Phenix City', 'Opelika', 'Daphne', 'Enterprise', 'Homewood', 'Pelham', 'Fairhope', 'Northport', 'Anniston', 'Albertville', 'Oxford', 'Troy', 'Selma', 'Muscle Shoals', 'Jasper', 'Cullman', 'Talladega', 'Foley', 'Gulf Shores', 'Orange Beach', 'Bessemer', 'Athens', 'Trussville', 'Mountain Brook', 'Ozark', 'Gardendale', 'Fort Payne', 'Scottsboro'],
  'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla', 'Kenai', 'Kodiak', 'Palmer', 'Soldotna', 'Homer', 'Valdez', 'Nome', 'Seward'],
  'Arizona': ['Phoenix', 'Tucson', 'Scottsdale', 'Mesa', 'Tempe', 'Flagstaff', 'Sedona', 'Chandler', 'Glendale', 'Gilbert', 'Peoria', 'Surprise', 'Yuma', 'Prescott', 'Lake Havasu City', 'Goodyear', 'Buckeye', 'Avondale', 'Sierra Vista', 'Maricopa', 'Casa Grande', 'Kingman', 'Queen Creek', 'Payson', 'Cottonwood', 'Bullhead City', 'Show Low', 'Globe'],
  'Arkansas': ['Little Rock', 'Fayetteville', 'Hot Springs', 'Bentonville', 'Fort Smith', 'Jonesboro', 'Conway', 'Rogers', 'Springdale', 'North Little Rock', 'Pine Bluff', 'Russellville', 'Texarkana', 'Cabot', 'Paragould', 'Benton', 'Searcy', 'El Dorado', 'Maumelle', 'Harrison', 'Mountain Home', 'Batesville', 'Eureka Springs'],
  'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland', 'Long Beach', 'Santa Cruz', 'San Jose', 'Fresno', 'Anaheim', 'Santa Ana', 'Riverside', 'Irvine', 'Santa Barbara', 'Berkeley', 'Pasadena', 'Ventura', 'Monterey', 'Palm Springs', 'Napa', 'Sonoma', 'Redondo Beach', 'Hermosa Beach', 'Manhattan Beach', 'West Hollywood', 'Culver City', 'Burbank', 'Glendale', 'Pomona', 'Oceanside', 'Carlsbad', 'Encinitas', 'San Luis Obispo', 'Santa Rosa', 'Eureka', 'Modesto', 'Stockton', 'Bakersfield', 'Redding', 'Chico'],
  'Colorado': ['Denver', 'Boulder', 'Colorado Springs', 'Fort Collins', 'Pueblo', 'Grand Junction', 'Durango', 'Steamboat Springs', 'Aspen', 'Vail', 'Telluride', 'Greeley', 'Loveland', 'Longmont', 'Arvada', 'Lakewood', 'Centennial', 'Westminster', 'Thornton', 'Broomfield', 'Castle Rock', 'Parker', 'Golden', 'Brighton', 'Littleton', 'Breckenridge', 'Glenwood Springs'],
  'Connecticut': ['Hartford', 'New Haven', 'Bridgeport', 'Stamford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain', 'West Hartford', 'Greenwich', 'Fairfield', 'Hamden', 'Meriden', 'Bristol', 'Milford', 'Middletown', 'New London', 'Mystic', 'Westport'],
  'Delaware': ['Wilmington', 'Dover', 'Newark', 'Rehoboth Beach', 'Middletown', 'Bear', 'Lewes', 'Georgetown', 'Milford', 'Bethany Beach', 'Dewey Beach', 'Smyrna'],
  'District of Columbia': ['Washington DC', 'Georgetown', 'Adams Morgan', 'Dupont Circle', 'U Street', 'Capitol Hill', 'Shaw', 'H Street'],
  'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'St. Petersburg', 'Gainesville', 'Fort Lauderdale', 'Tallahassee', 'Clearwater', 'Sarasota', 'West Palm Beach', 'Pensacola', 'Daytona Beach', 'Fort Myers', 'Naples', 'Key West', 'Delray Beach', 'Boca Raton', 'Hollywood', 'Pompano Beach', 'Coral Gables', 'Wynwood', 'Ybor City', 'St. Augustine', 'Ocala', 'Lakeland', 'Panama City', 'Destin', 'Cocoa Beach', 'Melbourne', 'Stuart', 'Jupiter', 'Lake Worth', 'Dunedin', 'Tarpon Springs'],
  'Georgia': ['Atlanta', 'Savannah', 'Athens', 'Augusta', 'Macon', 'Columbus', 'Marietta', 'Roswell', 'Alpharetta', 'Decatur', 'Sandy Springs', 'Kennesaw', 'Duluth', 'Lawrenceville', 'Johns Creek', 'Statesboro', 'Valdosta', 'Albany', 'Rome', 'Dalton', 'Tybee Island', 'Brunswick', 'Peachtree City', 'Woodstock', 'Canton'],
  'Hawaii': ['Honolulu', 'Maui', 'Kailua', 'Hilo', 'Lahaina', 'Kona', 'Waikiki', 'Kapaa', 'Wailea', 'Paia', 'Haleiwa', 'Kaneohe'],
  'Idaho': ['Boise', 'Moscow', 'Idaho Falls', "Coeur d'Alene", 'Nampa', 'Meridian', 'Pocatello', 'Twin Falls', 'Lewiston', 'Caldwell', 'Sandpoint', 'Sun Valley', 'Ketchum', 'McCall', 'Rexburg'],
  'Illinois': ['Chicago', 'Champaign', 'Springfield', 'Peoria', 'Bloomington', 'Evanston', 'Rockford', 'Aurora', 'Naperville', 'Joliet', 'Elgin', 'Schaumburg', 'Oak Park', 'Wicker Park', 'Logan Square', 'Lincoln Park', 'Wrigleyville', 'Pilsen', 'Normal', 'DeKalb', 'Carbondale', 'Galesburg', 'Urbana', 'Decatur', 'Quincy'],
  'Indiana': ['Indianapolis', 'Bloomington', 'Fort Wayne', 'Evansville', 'South Bend', 'Lafayette', 'Terre Haute', 'Muncie', 'Anderson', 'Carmel', 'Fishers', 'Noblesville', 'Columbus', 'Jeffersonville', 'New Albany', 'Broad Ripple', 'Fountain Square', 'Mass Ave', 'Greenwood'],
  'Iowa': ['Des Moines', 'Iowa City', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Waterloo', 'Council Bluffs', 'Dubuque', 'Ames', 'Cedar Falls', 'Burlington', 'Mason City', 'Bettendorf'],
  'Kansas': ['Kansas City', 'Wichita', 'Lawrence', 'Topeka', 'Overland Park', 'Olathe', 'Manhattan', 'Lenexa', 'Salina', 'Hutchinson', 'Leavenworth'],
  'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Covington', 'Owensboro', 'Frankfort', 'Paducah', 'Ashland', 'Newport', 'Florence', 'Georgetown', 'Richmond', 'Bardstown', 'Henderson', 'Elizabethtown', 'Murray'],
  'Louisiana': ['New Orleans', 'Baton Rouge', 'Lafayette', 'Shreveport', 'Lake Charles', 'Monroe', 'Alexandria', 'Kenner', 'Houma', 'Mandeville', 'Covington', 'Slidell', 'Metairie', 'Natchitoches', 'Ruston', 'Thibodaux'],
  'Maine': ['Portland', 'Bangor', 'Augusta', 'Lewiston', 'Brunswick', 'Biddeford', 'Bar Harbor', 'Camden', 'Rockland', 'Old Orchard Beach', 'Kennebunk', 'Ogunquit', 'Belfast', 'Ellsworth'],
  'Maryland': ['Baltimore', 'Annapolis', 'Rockville', 'Silver Spring', 'Frederick', 'Columbia', 'Bethesda', 'College Park', 'Towson', 'Hagerstown', 'Bowie', 'Salisbury', 'Ocean City', 'Ellicott City', 'Fells Point', 'Canton'],
  'Massachusetts': ['Boston', 'Cambridge', 'Somerville', 'Northampton', 'Worcester', 'Springfield', 'Salem', 'Plymouth', 'New Bedford', 'Fall River', 'Lowell', 'Brookline', 'Allston', 'Jamaica Plain', 'Amherst', 'Pittsfield', 'Provincetown', 'Gloucester', 'Newburyport', 'Hyannis'],
  'Michigan': ['Detroit', 'Ann Arbor', 'Grand Rapids', 'Kalamazoo', 'Lansing', 'Flint', 'Traverse City', 'Muskegon', 'Royal Oak', 'Ferndale', 'Hamtramck', 'Dearborn', 'Ypsilanti', 'Pontiac', 'Battle Creek', 'Holland', 'Saginaw', 'Bay City', 'Marquette', 'Petoskey', 'St. Joseph'],
  'Minnesota': ['Minneapolis', 'St. Paul', 'Duluth', 'Rochester', 'Bloomington', 'Brooklyn Park', 'Plymouth', 'Eagan', 'Mankato', 'Moorhead', 'St. Cloud', 'Winona', 'Northeast Minneapolis', 'Uptown', 'Dinkytown', 'Red Wing', 'Northfield'],
  'Mississippi': ['Jackson', 'Oxford', 'Hattiesburg', 'Biloxi', 'Gulfport', 'Tupelo', 'Meridian', 'Starkville', 'Columbus', 'Vicksburg', 'Natchez', 'Clarksdale', 'Greenville', 'Ocean Springs', 'Laurel', 'Southaven', 'Bay St. Louis'],
  'Missouri': ['Kansas City', 'St. Louis', 'Columbia', 'Springfield', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Charles', 'Blue Springs', 'Joplin', 'Jefferson City', 'Cape Girardeau', 'Branson', 'Sedalia', 'Westport', 'The Grove', 'Delmar Loop'],
  'Montana': ['Missoula', 'Bozeman', 'Billings', 'Helena', 'Great Falls', 'Butte', 'Kalispell', 'Whitefish', 'Livingston', 'Red Lodge', 'Hamilton'],
  'Nebraska': ['Omaha', 'Lincoln', 'Grand Island', 'Bellevue', 'Kearney', 'Fremont', 'Hastings', 'North Platte', 'Norfolk', 'Scottsbluff'],
  'Nevada': ['Las Vegas', 'Reno', 'Henderson', 'Sparks', 'Carson City', 'North Las Vegas', 'Elko', 'Mesquite', 'Boulder City', 'Laughlin', 'Downtown Las Vegas', 'Fremont Street'],
  'New Hampshire': ['Manchester', 'Portsmouth', 'Concord', 'Nashua', 'Dover', 'Rochester', 'Keene', 'Laconia', 'Lebanon', 'Hanover', 'Exeter', 'Hampton Beach', 'North Conway'],
  'New Jersey': ['Asbury Park', 'Newark', 'Jersey City', 'Hoboken', 'New Brunswick', 'Trenton', 'Atlantic City', 'Morristown', 'Red Bank', 'Montclair', 'Princeton', 'Camden', 'Paterson', 'Somerville', 'Lambertville', 'Cape May', 'Long Branch', 'Rahway', 'Collingswood'],
  'New Mexico': ['Albuquerque', 'Santa Fe', 'Las Cruces', 'Taos', 'Roswell', 'Farmington', 'Silver City', 'Gallup', 'Ruidoso', 'Carlsbad', 'Truth or Consequences', 'Mesilla'],
  'New York': ['New York City', 'Brooklyn', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Ithaca', 'Saratoga Springs', 'Woodstock', 'Kingston', 'Hudson', 'New Paltz', 'Beacon', 'Poughkeepsie', 'Yonkers', 'White Plains', 'Nyack', 'Tarrytown', 'Williamsburg', 'Bushwick', 'Astoria', 'Long Island City', 'Harlem', 'East Village', 'Lower East Side', 'Greenpoint'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Asheville', 'Durham', 'Wilmington', 'Greensboro', 'Winston-Salem', 'Chapel Hill', 'Boone', 'Brevard', 'Carrboro', 'Fayetteville', 'Hickory', 'Mooresville', 'Concord', 'Gastonia', 'High Point', 'Greenville', 'Outer Banks', 'Blowing Rock', 'Black Mountain'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Dickinson', 'Williston', 'Mandan', 'Jamestown'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Dayton', 'Akron', 'Toledo', 'Youngstown', 'Canton', 'Athens', 'Yellow Springs', 'Kent', 'Oxford', 'Lakewood', 'Tremont', 'Ohio City', 'Over-the-Rhine', 'Northside', 'Short North', 'German Village'],
  'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Edmond', 'Broken Arrow', 'Stillwater', 'Lawton', 'Moore', 'Midwest City', 'Bricktown', 'Blue Dome District', 'Cherry Street', 'Plaza District'],
  'Oregon': ['Portland', 'Eugene', 'Bend', 'Salem', 'Corvallis', 'Medford', 'Ashland', 'Hood River', 'Newport', 'Astoria', 'McMinnville', 'Albany', 'Springfield', 'Redmond', 'Grants Pass', 'Hawthorne', 'Alberta Arts', 'Mississippi Ave', 'Pearl District'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Lancaster', 'Allentown', 'Bethlehem', 'Scranton', 'Harrisburg', 'Reading', 'Erie', 'York', 'State College', 'Easton', 'Wilkes-Barre', 'New Hope', 'Media', 'Doylestown', 'West Chester', 'Manayunk', 'Fishtown', 'Northern Liberties', 'South Street', 'Lawrenceville', 'Strip District'],
  'Rhode Island': ['Providence', 'Newport', 'Warwick', 'Cranston', 'Pawtucket', 'Narragansett', 'Westerly', 'Bristol', 'East Greenwich', 'Woonsocket'],
  'South Carolina': ['Charleston', 'Columbia', 'Greenville', 'Myrtle Beach', 'Spartanburg', 'Mount Pleasant', 'Rock Hill', 'Hilton Head', 'Beaufort', 'Florence', 'Summerville', 'North Charleston', 'Folly Beach', 'Clemson', 'Aiken', 'Anderson'],
  'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Spearfish', 'Deadwood', 'Pierre', 'Vermillion', 'Mitchell'],
  'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Johnson City', 'Franklin', 'Jackson', 'Pigeon Forge', 'Gatlinburg', 'Cookeville', 'East Nashville', 'Germantown', 'Midtown', 'Beale Street', 'Cooper-Young', 'Old City'],
  'Texas': ['Austin', 'Houston', 'Dallas', 'San Antonio', 'Fort Worth', 'El Paso', 'Denton', 'Lubbock', 'Amarillo', 'Corpus Christi', 'Waco', 'Galveston', 'Fredericksburg', 'Marfa', 'San Marcos', 'New Braunfels', 'Georgetown', 'Round Rock', 'Plano', 'Frisco', 'Arlington', 'McKinney', 'Tyler', 'Beaumont', 'College Station', 'Midland', 'Odessa', 'South Congress', 'Deep Ellum', 'Bishop Arts', 'Montrose', 'Heights'],
  'Utah': ['Salt Lake City', 'Provo', 'Park City', 'Ogden', 'St. George', 'Logan', 'Moab', 'Layton', 'Orem', 'Springville', 'Cedar City', 'Brigham City', 'Bountiful'],
  'Vermont': ['Burlington', 'Montpelier', 'Brattleboro', 'Stowe', 'Manchester', 'Bennington', 'Rutland', 'Middlebury', 'St. Johnsbury', 'Woodstock', 'Killington', 'Waitsfield', 'Winooski'],
  'Virginia': ['Richmond', 'Charlottesville', 'Norfolk', 'Arlington', 'Virginia Beach', 'Alexandria', 'Roanoke', 'Fredericksburg', 'Harrisonburg', 'Blacksburg', 'Staunton', 'Lynchburg', 'Williamsburg', 'Newport News', 'Hampton', 'Manassas', 'Leesburg', 'Falls Church', 'Carytown', 'Scott\'s Addition', 'The Fan', 'Ghent', 'Shockoe Bottom'],
  'Washington': ['Seattle', 'Tacoma', 'Olympia', 'Spokane', 'Bellingham', 'Everett', 'Vancouver', 'Walla Walla', 'Yakima', 'Bremerton', 'Kennewick', 'Redmond', 'Kirkland', 'Fremont', 'Capitol Hill', 'Ballard', 'Columbia City', 'Georgetown', 'Leavenworth'],
  'West Virginia': ['Charleston', 'Morgantown', 'Huntington', 'Wheeling', 'Parkersburg', 'Martinsburg', 'Beckley', 'Lewisburg', 'Shepherdstown', 'Elkins', 'Thomas', 'Fayetteville'],
  'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Appleton', 'Oshkosh', 'La Crosse', 'Eau Claire', 'Racine', 'Kenosha', 'Waukesha', 'Sheboygan', 'Fond du Lac', 'Janesville', 'Bay View', 'Walker\'s Point', 'Brady Street', 'Third Ward'],
  'Wyoming': ['Cheyenne', 'Jackson', 'Laramie', 'Casper', 'Sheridan', 'Cody', 'Gillette', 'Rock Springs', 'Riverton', 'Lander', 'Thermopolis', 'Pinedale'],
  // Canada
  'Ontario': ['Toronto', 'Ottawa', 'Hamilton', 'London', 'Kingston', 'Mississauga', 'Brampton', 'Markham', 'Kitchener', 'Waterloo', 'Guelph', 'St. Catharines', 'Niagara Falls', 'Windsor', 'Sudbury', 'Thunder Bay', 'Barrie', 'Oshawa', 'Peterborough', 'Brantford', 'Kensington Market', 'Queen West', 'Ossington', 'Dundas West'],
  'Quebec': ['Montreal', 'Quebec City', 'Gatineau', 'Laval', 'Sherbrooke', 'Trois-Rivieres', 'Saguenay', 'Levis', 'Terrebonne', 'Saint-Jerome', 'Plateau', 'Mile End', 'St-Henri', 'Verdun', 'Hochelaga'],
  'British Columbia': ['Vancouver', 'Victoria', 'Kelowna', 'Nanaimo', 'Kamloops', 'Prince George', 'Vernon', 'Penticton', 'Nelson', 'Whistler', 'Tofino', 'Courtenay', 'Squamish', 'Commercial Drive', 'Gastown', 'Main Street'],
  'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'Medicine Hat', 'Grande Prairie', 'Airdrie', 'St. Albert', 'Spruce Grove', 'Canmore', 'Banff', 'Cochrane', 'Whyte Ave', 'Kensington', '17th Ave'],
  'Manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'The Exchange District', 'Osborne Village', 'Corydon'],
  'Saskatchewan': ['Saskatoon', 'Regina', 'Moose Jaw', 'Prince Albert', 'Swift Current', 'Yorkton', 'Broadway', 'Cathedral'],
  'Nova Scotia': ['Halifax', 'Dartmouth', 'Sydney', 'Truro', 'New Glasgow', 'Wolfville', 'Lunenburg', 'Barrington Street', 'Gottingen Street'],
  'New Brunswick': ['Fredericton', 'Saint John', 'Moncton', 'Dieppe', 'Bathurst', 'Edmundston', 'Miramichi'],
  // UK
  'London': ['London', 'Camden', 'Brixton', 'Shoreditch', 'Soho', 'Islington', 'Hackney', 'Dalston', 'Peckham', 'Deptford', 'Lewisham', 'Notting Hill', 'Shepherd\'s Bush', 'Hammersmith', 'Fulham', 'Clapham', 'Bermondsey', 'Bethnal Green', 'Stoke Newington'],
  'Manchester': ['Manchester', 'Salford', 'Northern Quarter', 'Ancoats', 'Withington', 'Didsbury', 'Chorlton', 'Stockport', 'Altrincham', 'Bolton', 'Bury', 'Oldham', 'Rochdale', 'Wigan'],
  'Birmingham': ['Birmingham', 'Digbeth', 'Moseley', 'Kings Heath', 'Harborne', 'Jewellery Quarter', 'Sutton Coldfield', 'Solihull'],
  'Liverpool': ['Liverpool', 'Baltic Triangle', 'Ropewalks', 'Woolton', 'Aigburth', 'Lark Lane'],
  'Leeds': ['Leeds', 'Headingley', 'Chapel Allerton', 'Meanwood', 'Horsforth', 'Call Lane'],
  'Glasgow': ['Glasgow', 'Merchant City', 'West End', 'Finnieston', 'Shawlands', 'Partick'],
  'Edinburgh': ['Edinburgh', 'Leith', 'Grassmarket', 'Cowgate', 'Lothian Road', 'Stockbridge', 'Portobello'],
  'Bristol': ['Bristol', 'Clifton', 'Stokes Croft', 'Bedminster', 'Harbourside', 'Easton', 'St Pauls'],
  'Sheffield': ['Sheffield', 'Kelham Island', 'Ecclesall Road', 'London Road', 'Neepsend'],
  'Newcastle': ['Newcastle', 'Gateshead', 'Ouseburn', 'Jesmond', 'Gosforth', 'Byker'],
  'Brighton': ['Brighton', 'Hove', 'Kemptown', 'North Laine', 'Hanover'],
  'Nottingham': ['Nottingham', 'Hockley', 'Lace Market', 'Beeston'],
  'Cardiff': ['Cardiff', 'Canton', 'Roath', 'Cathays', 'Cardiff Bay'],
  'Belfast': ['Belfast', 'Cathedral Quarter', 'Botanic', 'Ormeau', 'Smithfield'],
  // Australia
  'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Byron Bay', 'Central Coast', 'Blue Mountains', 'Newtown', 'Marrickville', 'Surry Hills', 'Darlinghurst', 'Enmore', 'Redfern', 'Parramatta', 'Manly'],
  'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Fitzroy', 'Collingwood', 'Northcote', 'Brunswick', 'St Kilda', 'Richmond', 'Footscray', 'Preston', 'Thornbury'],
  'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Cairns', 'Townsville', 'Fortitude Valley', 'West End', 'Newstead', 'South Bank', 'Burleigh Heads', 'Noosa'],
  'Western Australia': ['Perth', 'Fremantle', 'Northbridge', 'Leederville', 'Mt Lawley', 'Scarborough', 'Mandurah', 'Bunbury', 'Margaret River'],
  'South Australia': ['Adelaide', 'Henley Beach', 'Glenelg', 'Norwood', 'Prospect', 'Hindley Street', 'Leigh Street'],
  'Tasmania': ['Hobart', 'Launceston', 'Devonport', 'Salamanca', 'North Hobart'],
  // New Zealand
  'Auckland': ['Auckland', 'Ponsonby', 'Grey Lynn', 'Kingsland', 'K Road', 'Britomart', 'Takapuna', 'Devonport', 'Mt Eden', 'Newmarket'],
  'Wellington': ['Wellington', 'Cuba Street', 'Courtenay Place', 'Aro Valley', 'Newtown', 'Petone', 'Lower Hutt'],
  'Canterbury': ['Christchurch', 'Lyttelton', 'New Brighton', 'Sumner', 'Riccarton'],
  'Otago': ['Dunedin', 'Queenstown', 'Wanaka', 'Oamaru'],
  'Waikato': ['Hamilton', 'Tauranga', 'Raglan', 'Cambridge'],
};

function getCitiesForRegion(regionName: string): string[] {
  return REGION_CITIES[regionName] || [regionName];
}

// ─── Search Engines ──────────────────────────────────────────────────────────

let ddgFailCount = 0;

async function searchDuckDuckGo(query: string, maxResults = 15): Promise<RawSearchResult[]> {
  try {
    const resp = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://html.duckduckgo.com/',
        'Origin': 'https://html.duckduckgo.com',
      },
      body: `q=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      ddgFailCount++;
      throw new Error(`DuckDuckGo returned ${resp.status}`);
    }

    const html = await resp.text();
    const results: RawSearchResult[] = [];

    const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let url = match[1];
      if (url.includes('duckduckgo.com/y.js') || url.includes('ad_provider')) continue;

      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
      }
      url = url.replace(/&amp;/g, '&');
      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
      }

      if (!url.startsWith('http')) continue;

      const title = decodeEntities(match[2].trim());
      results.push({ title, url, snippet: '' });
      if (results.length >= maxResults) break;
    }

    if (results.length > 0) ddgFailCount = 0;
    else ddgFailCount++;

    await delay(REQUEST_DELAY);
    return results;
  } catch (err) {
    ddgFailCount++;
    console.warn('DuckDuckGo search failed:', (err as Error).message);
    return [];
  }
}

async function searchBing(query: string, maxResults = 15): Promise<RawSearchResult[]> {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${maxResults}`;
    const resp = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) return [];

    const html = await resp.text();
    const results: RawSearchResult[] = [];

    // Bing renders results as JS data or in cite tags — extract all external URLs with titles
    // First try: find <a> tags with external URLs near <h2> tags
    const linkRegex = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>\s*(?:<[^>]*>)*([^<]+)/gi;
    let match;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const resultUrl = match[1];
      if (resultUrl.includes('bing.com') || resultUrl.includes('microsoft.com') ||
          resultUrl.includes('bingj.com') || resultUrl.includes('microsoftonline')) continue;
      if (seenUrls.has(resultUrl)) continue;
      seenUrls.add(resultUrl);

      const title = decodeEntities(match[2].trim());
      if (!title || title.length < 5) continue;

      results.push({ title, url: resultUrl, snippet: '' });
      if (results.length >= maxResults) break;
    }

    await delay(REQUEST_DELAY);
    return results;
  } catch (err) {
    console.warn('Bing search failed:', (err as Error).message);
    return [];
  }
}

// Use DDG as primary; Bing as fallback when DDG is rate-limited
let searchCallCount = 0;
async function webSearch(query: string, maxResults = 15): Promise<RawSearchResult[]> {
  searchCallCount++;

  // Try DDG first unless it's been consistently failing
  if (ddgFailCount < 5) {
    const results = await searchDuckDuckGo(query, maxResults);
    if (results.length > 0) return results;
  }

  // Fallback to Bing
  const bingResults = await searchBing(query, maxResults);
  if (bingResults.length > 0) return bingResults;

  // Last resort: try DDG again even if failing (rate limit may have lifted)
  if (ddgFailCount >= 5 && searchCallCount % 5 === 0) {
    ddgFailCount = 0; // Reset and retry
    return searchDuckDuckGo(query, maxResults);
  }

  return [];
}

// ─── Page Scraping ───────────────────────────────────────────────────────────

const EMAIL_JUNK = [
  'sentry', 'webpack', 'example', 'wixpress', 'cloudflare', 'googleapis',
  'schema.org', 'squarespace', 'wordpress', 'gravatar', 'noreply', 'no-reply',
  'donotreply', 'mailer-daemon', 'postmaster', 'webmaster', 'localhost',
  'test@', 'user@', 'email@', 'name@', 'your', 'changeme',
  '.png', '.jpg', '.gif', '.svg', '.css', '.js',
];

function isValidEmail(email: string): boolean {
  const e = email.toLowerCase().trim();
  if (e.length < 5 || e.length > 80) return false;
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e)) return false;
  if (EMAIL_JUNK.some((junk) => e.includes(junk))) return false;
  return true;
}

function extractEmails(html: string): string[] {
  const matches = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
  const valid = matches.filter(isValidEmail);
  return [...new Set(valid.map((e) => e.toLowerCase()))];
}

function extractPhones(text: string): string[] {
  const patterns = [
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /(?:\+?44[-.\s]?)?\d{4,5}[-.\s]?\d{5,6}/g,
    /0\d{4}[-.\s]?\d{6}/g,
  ];
  const phones: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    phones.push(...matches);
  }
  return [...new Set(phones.map((p) => p.trim()))];
}

function extractAddress(text: string): string {
  const patterns = [
    /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct)\.?[,\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/,
    /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct)\.?[,\s]+[\w\s]+/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim().substring(0, 200);
  }
  return '';
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    await delay(REQUEST_DELAY);
    return html;
  } catch {
    return null;
  }
}

const EVENTS_PAGE_KEYWORDS = [
  'event', 'events', 'calendar', 'schedule', 'shows', 'lineup',
  'upcoming', 'whats-on', 'what-s-on', 'whatson', 'gig', 'gigs',
  'listings', 'live-music', 'performances', 'concerts', 'tonight',
  'this-week', 'this-month',
];

function findEventsPageUrl(html: string, baseUrl: string): string {
  const baseDomain = new URL(baseUrl).hostname;
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = stripTags(match[2]).toLowerCase().trim();
    const hrefLower = href.toLowerCase();
    const isEvents = EVENTS_PAGE_KEYWORDS.some((kw) => hrefLower.includes(kw) || text.includes(kw));
    if (!isEvents) continue;
    try {
      const full = new URL(href, baseUrl).href;
      if (new URL(full).hostname === baseDomain && full !== baseUrl && full.startsWith('http')) {
        return full;
      }
    } catch { /* skip */ }
  }
  return '';
}

function findContactPageUrls(html: string, baseUrl: string): string[] {
  const baseDomain = new URL(baseUrl).hostname;
  const contactKeywords = ['contact', 'booking', 'about', 'info', 'connect', 'reach-us', 'get-in-touch'];
  const urls: string[] = [];
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].toLowerCase();
    const hrefLower = href.toLowerCase();
    if (contactKeywords.some((kw) => hrefLower.includes(kw) || text.includes(kw))) {
      try {
        const full = new URL(href, baseUrl).href;
        if (new URL(full).hostname === baseDomain && full !== baseUrl) urls.push(full);
      } catch { /* skip */ }
    }
  }
  return urls.slice(0, 3);
}

async function scrapeBusinessWebsite(url: string, isVenue = false): Promise<Partial<ScrapedBusiness>> {
  const info: Partial<ScrapedBusiness> = { website: url };
  const html = await fetchPage(url);
  if (!html) return info;

  const text = stripTags(html);
  const emails = extractEmails(html);
  const phones = extractPhones(text);
  const address = extractAddress(text);

  if (address) info.address = address;
  if (phones.length > 0) info.phone = phones[0];
  if (isVenue) {
    const eventsUrl = findEventsPageUrl(html, url);
    if (eventsUrl) info.eventsUrl = eventsUrl;
    info.capacity = extractCapacity(text);
  }

  if (emails.length === 0) {
    const contactUrls = findContactPageUrls(html, url);
    for (const contactUrl of contactUrls) {
      const contactHtml = await fetchPage(contactUrl);
      if (contactHtml) {
        const contactEmails = extractEmails(contactHtml);
        if (contactEmails.length > 0) {
          emails.push(...contactEmails);
          if (!info.phone) {
            const contactPhones = extractPhones(stripTags(contactHtml));
            if (contactPhones.length > 0) info.phone = contactPhones[0];
          }
          break;
        }
      }
    }
  }

  if (emails.length > 0) info.email = emails[0];
  return info;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/');
}

// ─── Aggregator / List Detection ─────────────────────────────────────────────

const SKIP_DOMAINS = [
  'yelp.com', 'yellowpages.com', 'bbb.org', 'facebook.com', 'instagram.com',
  'twitter.com', 'linkedin.com', 'reddit.com', 'pinterest.com', 'tiktok.com',
  'tripadvisor.com', 'foursquare.com', 'mapquest.com', 'manta.com',
  'angieslist.com', 'angi.com', 'homeadvisor.com', 'thumbtack.com',
  'google.com', 'bing.com', 'yahoo.com', 'apple.com', 'amazon.com',
  'wikipedia.org', 'youtube.com',
  'houzz.com', 'bark.com', 'networx.com', 'porch.com', 'fixr.com',
  'improvenet.com', 'servicemagic.com', 'buildzoom.com', 'expertise.com',
  'poweredbythepeople.com', 'checkatrade.com', 'trustatrader.com',
  'mybuilder.com', 'ratedpeople.com', 'chamberofcommerce.com',
  'merchantcircle.com', 'superpages.com', 'dexknows.com', 'citysearch.com',
  'kudzu.com', 'hotfrog.com', 'brownbook.net', 'cylex.us.com',
  'nextdoor.com', 'alignable.com', 'crunchbase.com',
];

// Sites that publish "best of" lists — not individual businesses
const LIST_ARTICLE_DOMAINS = [
  'timeout.com', 'thrillist.com', 'eater.com', 'patch.com', 'buzzfeed.com',
  'tripadvisor.com', 'yelp.com', 'foursquare.com',
  'nytimes.com', 'washingtonpost.com',
  'songkick.com', 'bandsintown.com', 'eventbrite.com',
  'stubhub.com', 'ticketmaster.com',
  'peerspace.com', 'gigsalad.com', 'tagvenue.com',
  'concertfix.com', 'concerts50.com',
];

function isBusinessSite(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return !SKIP_DOMAINS.some((skip) => domain.includes(skip))
      && !LIST_ARTICLE_DOMAINS.some((skip) => domain.includes(skip));
  } catch {
    return false;
  }
}

function isListArticle(title: string, snippet: string, url: string): boolean {
  const combined = (title + ' ' + snippet).toLowerCase();
  const hasRelevant = ['venue', 'music', 'live', 'concert', 'club', 'bar', 'stage',
    'plumber', 'electrician', 'contractor', 'service'].some((kw) => combined.includes(kw));
  if (!hasRelevant) return false;

  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (LIST_ARTICLE_DOMAINS.some((d) => domain.includes(d))) return true;
  } catch { /* skip */ }

  // Check if title looks like a listicle
  return isListicleTitle(title);
}

function isListicleTitle(title: string): boolean {
  const t = title.toLowerCase().trim();
  const patterns = [
    /^\d+\s+best\b/, /^top\s+\d+/, /^\d+\s+amazing/, /^\d+\s+great/,
    /^\d+\s+places/, /^\d+\s+must/, /\bbest\s+\d+\b/, /\btop\s+\d+\b/,
    /\b\d+\s+best\b/, /\bbest\s+.*\bvenues?\b.*\bin\b/, /\bbest\s+places\s+to\b/,
    /\bwhere\s+to\s+find\b/, /\bguide\s+to\b/, /\bplaces\s+to\s+(?:hear|see|enjoy)\b/,
  ];
  return patterns.some((p) => p.test(t));
}

// ─── List Article Scraping ───────────────────────────────────────────────────

function extractNamesFromListPage(html: string, pageUrl: string): { name: string; website: string }[] {
  const results: { name: string; website: string }[] = [];
  const pageDomain = new URL(pageUrl).hostname;

  // Look for h2, h3, h4 headings which typically list individual businesses
  const headingRegex = /<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const inner = match[1];
    let name = stripTags(inner).trim();

    // Strip numbered prefixes: "1.", "3)", "10 -"
    name = name.replace(/^\d+[\.\)\]\-–—]\s*/, '').trim();

    if (!looksLikeBusinessName(name)) continue;
    if (isListicleTitle(name)) continue;

    // Check for a link to an external site (the business's own website)
    let website = '';
    const linkMatch = inner.match(/<a[^>]+href="(https?:\/\/[^"]+)"/i);
    if (linkMatch) {
      try {
        const linkDomain = new URL(linkMatch[1]).hostname;
        if (linkDomain !== pageDomain) website = linkMatch[1];
      } catch { /* skip */ }
    }

    results.push({ name, website });
  }

  return results;
}

function looksLikeBusinessName(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length < 4 || t.length > 80) return false;

  const junk = [
    'live music in', 'concerts in', 'music venues in', 'things to do',
    'where to find', 'your guide to', 'upcoming events', 'buy tickets',
    'vacation', 'contact', 'about us', 'home', 'gallery', 'menu',
    'editors picks', 'stay in the know', 'welcome', 'get more coverage',
    'read more', 'see also', 'related', 'advertisement', 'sponsored',
    'subscribe', 'sign up', 'follow us', 'share this',
  ];
  if (junk.some((j) => t.includes(j))) return false;
  if (t === t.toLowerCase() && text.split(/\s+/).length <= 3) return false;

  const words = text.split(/\s+/);
  if (!words.some((w) => w.length > 0 && w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase())) {
    return false;
  }
  return true;
}

// ─── Name Cleaning ───────────────────────────────────────────────────────────

function extractBusinessNameFromTitle(title: string): string {
  let name = title.split(/\s*[\|–—]\s*/)[0].trim();
  name = name.replace(/\s*-\s*(Home|About|Contact|Services|Welcome).*$/i, '').trim();
  return name;
}

// ─── Venue Capacity Filtering ────────────────────────────────────────────────

const MAX_VENUE_CAPACITY = 250;

const LARGE_VENUE_INDICATORS = [
  'amphitheater', 'amphitheatre', 'arena', 'stadium', 'pavilion',
  'coliseum', 'colosseum', 'civic center', 'civic centre',
  'convention', 'fairground', 'speedway', 'raceway',
  'performing arts centre', 'performing arts center',
  'opera house', 'auditorium',
];

function isLargeVenueByName(name: string): boolean {
  const n = name.toLowerCase();
  return LARGE_VENUE_INDICATORS.some((indicator) => n.includes(indicator));
}

function extractCapacity(text: string): number | null {
  const patterns = [
    /(?:capacity|max\.?\s*capacity|max)\s*(?:of\s*)?[:;]?\s*(\d[\d,]*)/i,
    /(?:holds?|seats?|accommodates?|fits?)\s+(?:up\s+to\s+)?(\d[\d,]*)\s*(?:people|guests|patrons|persons?|standing|seated)?/i,
    /(\d[\d,]*)\s*[-–]\s*(?:person|seat|capacity|cap)/i,
    /(?:up\s+to|approximately|approx\.?|about|max)\s+(\d[\d,]*)\s*(?:people|guests|patrons|persons?|standing|seated|capacity)/i,
    /(?:standing\s*(?:room|capacity)|standing)\s*[:;]?\s*(\d[\d,]*)/i,
    /(?:seated\s*(?:capacity)?)\s*[:;]?\s*(\d[\d,]*)/i,
  ];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      const num = parseInt(matches[1].replace(/,/g, ''), 10);
      // Reasonable venue capacity range (ignore years, zip codes, etc.)
      if (num >= 20 && num <= 10000) return num;
    }
  }
  return null;
}

// ─── Entertainment/Venue Types ───────────────────────────────────────────────

const VENUE_BUSINESS_TYPES = new Set([
  'live_music_venue', 'music_bar', 'concert_hall', 'nightclub',
  'brewery_venue', 'comedy_club',
]);

// ─── Main Export Interface ───────────────────────────────────────────────────

export interface WebSearchResult {
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
  eventsUrl: string;
}

// ─── Venue-Specific Search (city-level + list scraping) ──────────────────────

async function scrapeVenueBatch(
  urls: { name: string; url: string }[],
  businessType: string,
  regionId: string,
  regionName: string,
  country: string,
  onStatus?: (msg: string) => void,
): Promise<WebSearchResult[]> {
  // Scrape up to 4 venues in parallel
  const results = await Promise.all(
    urls.map(async ({ name, url }) => {
      // Filter out large venues by name before scraping
      if (isLargeVenueByName(name)) {
        onStatus?.(`Skipping large venue: ${name}`);
        return null;
      }

      const scraped = await scrapeBusinessWebsite(url, true);
      if (!scraped.email) return null;

      // Filter out venues with capacity over 250
      if (scraped.capacity && scraped.capacity > MAX_VENUE_CAPACITY) {
        onStatus?.(`Skipping ${name} (capacity: ${scraped.capacity})`);
        return null;
      }

      return {
        name,
        businessType,
        address: scraped.address || '',
        city: '',
        regionId,
        regionName,
        country,
        phone: scraped.phone || '',
        email: scraped.email,
        website: url,
        rating: null,
        reviewCount: 0,
        source: 'web_search',
        eventsUrl: scraped.eventsUrl || '',
      } as WebSearchResult;
    })
  );
  return results.filter((r): r is WebSearchResult => r !== null);
}

async function searchVenues(
  regionId: string,
  regionName: string,
  country: string,
  businessType: string,
  businessTypeName: string,
  maxResults: number,
  onStatus?: (msg: string) => void,
): Promise<WebSearchResult[]> {
  const businesses: WebSearchResult[] = [];
  const seenDomains = new Set<string>();
  const seenNames = new Set<string>();
  const venueResults: { name: string; url: string }[] = [];
  const listArticleUrls: { title: string; url: string }[] = [];

  // Use top 6 cities + state-level queries — sequential to avoid rate limiting
  const cities = getCitiesForRegion(regionName).slice(0, 6);
  const searchQueries: string[] = [
    `${businessTypeName} ${regionName}`,
    `best ${businessTypeName} ${regionName}`,
  ];
  for (const city of cities) {
    searchQueries.push(`${businessTypeName} ${city} ${regionName}`);
  }

  // Phase 1: Search ONE AT A TIME to avoid rate limiting
  for (let i = 0; i < searchQueries.length; i++) {
    onStatus?.(`Search ${i + 1}/${searchQueries.length}: "${searchQueries[i]}" (${venueResults.length} venues found)...`);
    const results = await webSearch(searchQueries[i], 20);

    for (const r of results) {
      if (r.url.includes('duckduckgo.com') || r.url.includes('google.com/aclk')) continue;

      let domain: string;
      try {
        domain = new URL(r.url).hostname.toLowerCase();
        if (seenDomains.has(domain)) continue;
        seenDomains.add(domain);
      } catch { continue; }

      if (isListArticle(r.title, r.snippet, r.url)) {
        listArticleUrls.push({ title: r.title, url: r.url });
      } else if (isBusinessSite(r.url) && !isListicleTitle(r.title)) {
        const name = extractBusinessNameFromTitle(r.title);
        if (name && name.length >= 3 && !isLargeVenueByName(name)) {
          if (!seenNames.has(name.toLowerCase())) {
            seenNames.add(name.toLowerCase());
            venueResults.push({ name, url: r.url });
          }
        }
      }
    }
  }

  onStatus?.(`Found ${venueResults.length} venues, ${listArticleUrls.length} list articles — scraping lists...`);

  // Phase 2: Scrape up to 8 list articles in parallel for venue names
  const listArticlesToScrape = listArticleUrls.slice(0, 8);
  const listPages = await Promise.all(
    listArticlesToScrape.map(async (a) => {
      const html = await fetchPage(a.url);
      return html ? { html, url: a.url } : null;
    })
  );

  for (const page of listPages) {
    if (!page) continue;
    const extracted = extractNamesFromListPage(page.html, page.url);
    for (const v of extracted) {
      if (seenNames.has(v.name.toLowerCase())) continue;
      if (isLargeVenueByName(v.name)) continue;
      seenNames.add(v.name.toLowerCase());

      if (v.website) {
        try {
          const domain = new URL(v.website).hostname.toLowerCase();
          if (!seenDomains.has(domain)) {
            seenDomains.add(domain);
            venueResults.push({ name: v.name, url: v.website });
          }
        } catch { /* skip */ }
      } else {
        // No direct URL — search for this venue by name
        venueResults.push({ name: v.name, url: '' });
      }
    }
  }

  // Phase 2b: For venues without URLs, search one at a time (max 10 to avoid rate limits)
  const needUrls = venueResults.filter((v) => !v.url).slice(0, 10);
  if (needUrls.length > 0) {
    onStatus?.(`Finding websites for ${needUrls.length} venues from lists...`);
  }
  for (const v of needUrls) {
    const results = await webSearch(`"${v.name}" ${regionName} venue website`, 5);
    for (const r of results) {
      if (!isBusinessSite(r.url)) continue;
      try {
        const domain = new URL(r.url).hostname.toLowerCase();
        if (seenDomains.has(domain)) continue;
        seenDomains.add(domain);
        v.url = r.url;
        break;
      } catch { continue; }
    }
  }

  // Remove entries without URLs
  const validVenues = venueResults.filter((v) => v.url);
  onStatus?.(`Scraping ${validVenues.length} venue websites for contact info...`);

  // Phase 3: Scrape venues in parallel batches of 6
  const batchSize = 6;
  for (let i = 0; i < validVenues.length; i += batchSize) {
    if (businesses.length >= maxResults) break;

    const batch = validVenues.slice(i, i + batchSize);
    onStatus?.(`Scraping batch ${Math.floor(i / batchSize) + 1} (${businesses.length}/${maxResults} found with email)...`);

    const results = await scrapeVenueBatch(batch, businessType, regionId, regionName, country, onStatus);
    businesses.push(...results);
  }

  return businesses.slice(0, maxResults);
}

// ─── General Business Search ─────────────────────────────────────────────────

async function searchGeneral(
  regionId: string,
  regionName: string,
  country: string,
  businessType: string,
  businessTypeName: string,
  maxResults: number,
  onStatus?: (msg: string) => void,
): Promise<WebSearchResult[]> {
  const businesses: WebSearchResult[] = [];
  const seenDomains = new Set<string>();
  const seenNames = new Set<string>();
  const candidates: { name: string; url: string }[] = [];

  // Use focused queries — top 6 cities max + state-level
  const cities = getCitiesForRegion(regionName).slice(0, 6);
  const queries = [
    `${businessTypeName} ${regionName} website email`,
    `best ${businessTypeName} company ${regionName}`,
  ];
  for (const city of cities) {
    queries.push(`${businessTypeName} ${city} ${regionName}`);
  }

  // Phase 1: Search ONE AT A TIME with proper delays to avoid rate limiting
  for (let i = 0; i < queries.length; i++) {
    if (candidates.length >= maxResults * 3) break;

    onStatus?.(`Search ${i + 1}/${queries.length}: "${queries[i]}" (${candidates.length} candidates)...`);
    const results = await webSearch(queries[i], 20);

    for (const result of results) {
      if (!isBusinessSite(result.url)) continue;

      try {
        const domain = new URL(result.url).hostname.toLowerCase();
        if (seenDomains.has(domain)) continue;
        seenDomains.add(domain);
      } catch { continue; }

      const name = extractBusinessNameFromTitle(result.title);
      if (!name || name.length < 3) continue;
      if (seenNames.has(name.toLowerCase())) continue;
      seenNames.add(name.toLowerCase());

      candidates.push({ name, url: result.url });
    }
  }

  onStatus?.(`Found ${candidates.length} candidates — scraping websites for contact info...`);

  // Phase 2: Scrape candidates in batches of 4 for email/phone
  const batchSize = 4;
  for (let i = 0; i < candidates.length; i += batchSize) {
    if (businesses.length >= maxResults) break;

    const batch = candidates.slice(i, i + batchSize);
    onStatus?.(`Scraping batch ${Math.floor(i / batchSize) + 1} (${businesses.length}/${maxResults} found with email)...`);

    const scraped = await Promise.all(
      batch.map(async ({ name, url }) => {
        const info = await scrapeBusinessWebsite(url, false);
        if (!info.email) return null;
        return {
          name,
          businessType,
          address: info.address || '',
          city: '',
          regionId,
          regionName,
          country,
          phone: info.phone || '',
          email: info.email,
          website: url,
          rating: null,
          reviewCount: 0,
          source: 'web_search',
          eventsUrl: '',
        } as WebSearchResult;
      })
    );

    businesses.push(...scraped.filter((r): r is WebSearchResult => r !== null));
  }

  return businesses.slice(0, maxResults);
}

// ─── Public Entry Point ──────────────────────────────────────────────────────

export async function searchBusinessesWeb(
  regionId: string,
  regionName: string,
  country: string,
  businessType: string,
  businessTypeName: string,
  maxResults: number,
  onStatus?: (msg: string) => void,
): Promise<WebSearchResult[]> {
  // Reset search engine fail counters for fresh start
  ddgFailCount = 0;
  searchCallCount = 0;

  if (VENUE_BUSINESS_TYPES.has(businessType)) {
    return searchVenues(regionId, regionName, country, businessType, businessTypeName, maxResults, onStatus);
  }
  return searchGeneral(regionId, regionName, country, businessType, businessTypeName, maxResults, onStatus);
}
