export interface Region {
  id: string;
  name: string;
  country: string;
  category: string;
}

export interface RegionCategory {
  id: string;
  name: string;
  flag: string;
  regions: Region[];
}

const US_STATES: Region[] = [
  { id: 'us-al', name: 'Alabama', country: 'US', category: 'us-states' },
  { id: 'us-ak', name: 'Alaska', country: 'US', category: 'us-states' },
  { id: 'us-az', name: 'Arizona', country: 'US', category: 'us-states' },
  { id: 'us-ar', name: 'Arkansas', country: 'US', category: 'us-states' },
  { id: 'us-ca', name: 'California', country: 'US', category: 'us-states' },
  { id: 'us-co', name: 'Colorado', country: 'US', category: 'us-states' },
  { id: 'us-ct', name: 'Connecticut', country: 'US', category: 'us-states' },
  { id: 'us-de', name: 'Delaware', country: 'US', category: 'us-states' },
  { id: 'us-dc', name: 'District of Columbia', country: 'US', category: 'us-states' },
  { id: 'us-fl', name: 'Florida', country: 'US', category: 'us-states' },
  { id: 'us-ga', name: 'Georgia', country: 'US', category: 'us-states' },
  { id: 'us-hi', name: 'Hawaii', country: 'US', category: 'us-states' },
  { id: 'us-id', name: 'Idaho', country: 'US', category: 'us-states' },
  { id: 'us-il', name: 'Illinois', country: 'US', category: 'us-states' },
  { id: 'us-in', name: 'Indiana', country: 'US', category: 'us-states' },
  { id: 'us-ia', name: 'Iowa', country: 'US', category: 'us-states' },
  { id: 'us-ks', name: 'Kansas', country: 'US', category: 'us-states' },
  { id: 'us-ky', name: 'Kentucky', country: 'US', category: 'us-states' },
  { id: 'us-la', name: 'Louisiana', country: 'US', category: 'us-states' },
  { id: 'us-me', name: 'Maine', country: 'US', category: 'us-states' },
  { id: 'us-md', name: 'Maryland', country: 'US', category: 'us-states' },
  { id: 'us-ma', name: 'Massachusetts', country: 'US', category: 'us-states' },
  { id: 'us-mi', name: 'Michigan', country: 'US', category: 'us-states' },
  { id: 'us-mn', name: 'Minnesota', country: 'US', category: 'us-states' },
  { id: 'us-ms', name: 'Mississippi', country: 'US', category: 'us-states' },
  { id: 'us-mo', name: 'Missouri', country: 'US', category: 'us-states' },
  { id: 'us-mt', name: 'Montana', country: 'US', category: 'us-states' },
  { id: 'us-ne', name: 'Nebraska', country: 'US', category: 'us-states' },
  { id: 'us-nv', name: 'Nevada', country: 'US', category: 'us-states' },
  { id: 'us-nh', name: 'New Hampshire', country: 'US', category: 'us-states' },
  { id: 'us-nj', name: 'New Jersey', country: 'US', category: 'us-states' },
  { id: 'us-nm', name: 'New Mexico', country: 'US', category: 'us-states' },
  { id: 'us-ny', name: 'New York', country: 'US', category: 'us-states' },
  { id: 'us-nc', name: 'North Carolina', country: 'US', category: 'us-states' },
  { id: 'us-nd', name: 'North Dakota', country: 'US', category: 'us-states' },
  { id: 'us-oh', name: 'Ohio', country: 'US', category: 'us-states' },
  { id: 'us-ok', name: 'Oklahoma', country: 'US', category: 'us-states' },
  { id: 'us-or', name: 'Oregon', country: 'US', category: 'us-states' },
  { id: 'us-pa', name: 'Pennsylvania', country: 'US', category: 'us-states' },
  { id: 'us-ri', name: 'Rhode Island', country: 'US', category: 'us-states' },
  { id: 'us-sc', name: 'South Carolina', country: 'US', category: 'us-states' },
  { id: 'us-sd', name: 'South Dakota', country: 'US', category: 'us-states' },
  { id: 'us-tn', name: 'Tennessee', country: 'US', category: 'us-states' },
  { id: 'us-tx', name: 'Texas', country: 'US', category: 'us-states' },
  { id: 'us-ut', name: 'Utah', country: 'US', category: 'us-states' },
  { id: 'us-vt', name: 'Vermont', country: 'US', category: 'us-states' },
  { id: 'us-va', name: 'Virginia', country: 'US', category: 'us-states' },
  { id: 'us-wa', name: 'Washington', country: 'US', category: 'us-states' },
  { id: 'us-wv', name: 'West Virginia', country: 'US', category: 'us-states' },
  { id: 'us-wi', name: 'Wisconsin', country: 'US', category: 'us-states' },
  { id: 'us-wy', name: 'Wyoming', country: 'US', category: 'us-states' },
];

const CA_PROVINCES: Region[] = [
  { id: 'ca-ab', name: 'Alberta', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-bc', name: 'British Columbia', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-mb', name: 'Manitoba', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-nb', name: 'New Brunswick', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-nl', name: 'Newfoundland and Labrador', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-ns', name: 'Nova Scotia', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-nt', name: 'Northwest Territories', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-nu', name: 'Nunavut', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-on', name: 'Ontario', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-pe', name: 'Prince Edward Island', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-qc', name: 'Quebec', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-sk', name: 'Saskatchewan', country: 'CA', category: 'ca-provinces' },
  { id: 'ca-yt', name: 'Yukon', country: 'CA', category: 'ca-provinces' },
];

const UK_COUNTIES: Region[] = [
  // England
  { id: 'uk-beds', name: 'Bedfordshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-berks', name: 'Berkshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-brist', name: 'Bristol', country: 'UK', category: 'uk-counties' },
  { id: 'uk-bucks', name: 'Buckinghamshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-cambs', name: 'Cambridgeshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-ches', name: 'Cheshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-corn', name: 'Cornwall', country: 'UK', category: 'uk-counties' },
  { id: 'uk-cumb', name: 'Cumbria', country: 'UK', category: 'uk-counties' },
  { id: 'uk-derby', name: 'Derbyshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-devon', name: 'Devon', country: 'UK', category: 'uk-counties' },
  { id: 'uk-dorset', name: 'Dorset', country: 'UK', category: 'uk-counties' },
  { id: 'uk-durham', name: 'Durham', country: 'UK', category: 'uk-counties' },
  { id: 'uk-essex', name: 'Essex', country: 'UK', category: 'uk-counties' },
  { id: 'uk-glos', name: 'Gloucestershire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-gman', name: 'Greater Manchester', country: 'UK', category: 'uk-counties' },
  { id: 'uk-hamps', name: 'Hampshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-here', name: 'Herefordshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-herts', name: 'Hertfordshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-iow', name: 'Isle of Wight', country: 'UK', category: 'uk-counties' },
  { id: 'uk-kent', name: 'Kent', country: 'UK', category: 'uk-counties' },
  { id: 'uk-lancs', name: 'Lancashire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-leics', name: 'Leicestershire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-lincs', name: 'Lincolnshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-london', name: 'London', country: 'UK', category: 'uk-counties' },
  { id: 'uk-mersey', name: 'Merseyside', country: 'UK', category: 'uk-counties' },
  { id: 'uk-norfolk', name: 'Norfolk', country: 'UK', category: 'uk-counties' },
  { id: 'uk-nhants', name: 'Northamptonshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-nland', name: 'Northumberland', country: 'UK', category: 'uk-counties' },
  { id: 'uk-notts', name: 'Nottinghamshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-oxon', name: 'Oxfordshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-rutland', name: 'Rutland', country: 'UK', category: 'uk-counties' },
  { id: 'uk-shrops', name: 'Shropshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-som', name: 'Somerset', country: 'UK', category: 'uk-counties' },
  { id: 'uk-syorks', name: 'South Yorkshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-staffs', name: 'Staffordshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-suffolk', name: 'Suffolk', country: 'UK', category: 'uk-counties' },
  { id: 'uk-surrey', name: 'Surrey', country: 'UK', category: 'uk-counties' },
  { id: 'uk-tyne', name: 'Tyne and Wear', country: 'UK', category: 'uk-counties' },
  { id: 'uk-warks', name: 'Warwickshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-wmids', name: 'West Midlands', country: 'UK', category: 'uk-counties' },
  { id: 'uk-wsussex', name: 'West Sussex', country: 'UK', category: 'uk-counties' },
  { id: 'uk-esussex', name: 'East Sussex', country: 'UK', category: 'uk-counties' },
  { id: 'uk-wyorks', name: 'West Yorkshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-wilts', name: 'Wiltshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-worcs', name: 'Worcestershire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-eyorks', name: 'East Riding of Yorkshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-nyorks', name: 'North Yorkshire', country: 'UK', category: 'uk-counties' },
  // Scotland
  { id: 'uk-aberdeen', name: 'Aberdeenshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-angus', name: 'Angus', country: 'UK', category: 'uk-counties' },
  { id: 'uk-argyll', name: 'Argyll and Bute', country: 'UK', category: 'uk-counties' },
  { id: 'uk-ayrshire', name: 'Ayrshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-dumfries', name: 'Dumfries and Galloway', country: 'UK', category: 'uk-counties' },
  { id: 'uk-dundee', name: 'Dundee', country: 'UK', category: 'uk-counties' },
  { id: 'uk-edinburgh', name: 'Edinburgh', country: 'UK', category: 'uk-counties' },
  { id: 'uk-fife', name: 'Fife', country: 'UK', category: 'uk-counties' },
  { id: 'uk-glasgow', name: 'Glasgow', country: 'UK', category: 'uk-counties' },
  { id: 'uk-highland', name: 'Highland', country: 'UK', category: 'uk-counties' },
  { id: 'uk-lanark', name: 'Lanarkshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-lothian', name: 'Lothian', country: 'UK', category: 'uk-counties' },
  { id: 'uk-moray', name: 'Moray', country: 'UK', category: 'uk-counties' },
  { id: 'uk-perth', name: 'Perth and Kinross', country: 'UK', category: 'uk-counties' },
  { id: 'uk-borders', name: 'Scottish Borders', country: 'UK', category: 'uk-counties' },
  { id: 'uk-stirling', name: 'Stirling', country: 'UK', category: 'uk-counties' },
  // Wales
  { id: 'uk-cardiff', name: 'Cardiff', country: 'UK', category: 'uk-counties' },
  { id: 'uk-swansea', name: 'Swansea', country: 'UK', category: 'uk-counties' },
  { id: 'uk-gwynedd', name: 'Gwynedd', country: 'UK', category: 'uk-counties' },
  { id: 'uk-pembroke', name: 'Pembrokeshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-carmarthen', name: 'Carmarthenshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-ceredigion', name: 'Ceredigion', country: 'UK', category: 'uk-counties' },
  { id: 'uk-powys', name: 'Powys', country: 'UK', category: 'uk-counties' },
  { id: 'uk-denbigh', name: 'Denbighshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-flint', name: 'Flintshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-wrexham', name: 'Wrexham', country: 'UK', category: 'uk-counties' },
  { id: 'uk-monmouth', name: 'Monmouthshire', country: 'UK', category: 'uk-counties' },
  { id: 'uk-newport', name: 'Newport', country: 'UK', category: 'uk-counties' },
  { id: 'uk-vale', name: 'Vale of Glamorgan', country: 'UK', category: 'uk-counties' },
  // Northern Ireland
  { id: 'uk-antrim', name: 'Antrim', country: 'UK', category: 'uk-counties' },
  { id: 'uk-armagh', name: 'Armagh', country: 'UK', category: 'uk-counties' },
  { id: 'uk-belfast', name: 'Belfast', country: 'UK', category: 'uk-counties' },
  { id: 'uk-derry', name: 'Derry / Londonderry', country: 'UK', category: 'uk-counties' },
  { id: 'uk-down', name: 'Down', country: 'UK', category: 'uk-counties' },
  { id: 'uk-fermanagh', name: 'Fermanagh', country: 'UK', category: 'uk-counties' },
  { id: 'uk-tyrone', name: 'Tyrone', country: 'UK', category: 'uk-counties' },
];

const AU_STATES: Region[] = [
  { id: 'au-act', name: 'Australian Capital Territory', country: 'AU', category: 'au-states' },
  { id: 'au-nsw', name: 'New South Wales', country: 'AU', category: 'au-states' },
  { id: 'au-nt', name: 'Northern Territory', country: 'AU', category: 'au-states' },
  { id: 'au-qld', name: 'Queensland', country: 'AU', category: 'au-states' },
  { id: 'au-sa', name: 'South Australia', country: 'AU', category: 'au-states' },
  { id: 'au-tas', name: 'Tasmania', country: 'AU', category: 'au-states' },
  { id: 'au-vic', name: 'Victoria', country: 'AU', category: 'au-states' },
  { id: 'au-wa', name: 'Western Australia', country: 'AU', category: 'au-states' },
];

const NZ_REGIONS: Region[] = [
  { id: 'nz-auckland', name: 'Auckland', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-bay', name: 'Bay of Plenty', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-canterbury', name: 'Canterbury', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-gisborne', name: 'Gisborne', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-hawkes', name: "Hawke's Bay", country: 'NZ', category: 'nz-regions' },
  { id: 'nz-manawatu', name: 'Manawatu-Whanganui', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-marlborough', name: 'Marlborough', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-nelson', name: 'Nelson', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-northland', name: 'Northland', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-otago', name: 'Otago', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-southland', name: 'Southland', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-taranaki', name: 'Taranaki', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-tasman', name: 'Tasman', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-waikato', name: 'Waikato', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-wellington', name: 'Wellington', country: 'NZ', category: 'nz-regions' },
  { id: 'nz-westcoast', name: 'West Coast', country: 'NZ', category: 'nz-regions' },
];

export const REGION_CATEGORIES: RegionCategory[] = [
  { id: 'us-states', name: 'US States', flag: 'US', regions: US_STATES },
  { id: 'ca-provinces', name: 'Canadian Provinces', flag: 'CA', regions: CA_PROVINCES },
  { id: 'uk-counties', name: 'UK Counties', flag: 'GB', regions: UK_COUNTIES },
  { id: 'au-states', name: 'Australian States', flag: 'AU', regions: AU_STATES },
  { id: 'nz-regions', name: 'New Zealand Regions', flag: 'NZ', regions: NZ_REGIONS },
];

export function getAllRegions(): Region[] {
  return REGION_CATEGORIES.flatMap(c => c.regions);
}

export function getRegionById(id: string): Region | undefined {
  return getAllRegions().find(r => r.id === id);
}
