export interface BusinessType {
  id: string;
  name: string;
  category: string;
  searchTerms: string[];
}

export const BUSINESS_CATEGORIES = [
  'Home Services',
  'Professional Services',
  'Health & Wellness',
  'Automotive',
  'Personal Care',
  'Food & Hospitality',
  'Education & Childcare',
  'Pet Services',
  'Cleaning & Maintenance',
  'Specialty Trades',
] as const;

export const BUSINESS_TYPES: BusinessType[] = [
  // Home Services
  { id: 'plumber', name: 'Plumber', category: 'Home Services', searchTerms: ['plumbing service', 'plumber near me', 'plumbing contractor'] },
  { id: 'electrician', name: 'Electrician', category: 'Home Services', searchTerms: ['electrician service', 'electrical contractor', 'electrician near me'] },
  { id: 'hvac', name: 'HVAC Technician', category: 'Home Services', searchTerms: ['HVAC service', 'heating and cooling', 'air conditioning repair'] },
  { id: 'landscaper', name: 'Landscaper', category: 'Home Services', searchTerms: ['landscaping service', 'lawn care service', 'landscaper near me'] },
  { id: 'painter', name: 'Painter / Decorator', category: 'Home Services', searchTerms: ['house painter', 'painting contractor', 'interior decorator'] },
  { id: 'roofer', name: 'Roofer', category: 'Home Services', searchTerms: ['roofing contractor', 'roof repair service', 'roofer near me'] },
  { id: 'kitchen_installer', name: 'Kitchen Installer', category: 'Home Services', searchTerms: ['kitchen remodel', 'kitchen installer', 'kitchen renovation contractor'] },
  { id: 'bathroom_remodeler', name: 'Bathroom Remodeler', category: 'Home Services', searchTerms: ['bathroom remodel', 'bathroom renovation', 'bathroom contractor'] },
  { id: 'flooring', name: 'Flooring Specialist', category: 'Home Services', searchTerms: ['flooring installer', 'hardwood flooring', 'flooring contractor'] },
  { id: 'fencing', name: 'Fencing Contractor', category: 'Home Services', searchTerms: ['fence installer', 'fencing company', 'fence contractor'] },
  { id: 'garage_door', name: 'Garage Door Service', category: 'Home Services', searchTerms: ['garage door repair', 'garage door installer', 'garage door service'] },
  { id: 'handyman', name: 'Handyman', category: 'Home Services', searchTerms: ['handyman service', 'home repair service', 'handyman near me'] },

  // Professional Services
  { id: 'accountant', name: 'Accountant', category: 'Professional Services', searchTerms: ['accounting firm', 'CPA near me', 'tax accountant'] },
  { id: 'lawyer', name: 'Lawyer / Attorney', category: 'Professional Services', searchTerms: ['law firm', 'attorney near me', 'legal services'] },
  { id: 'real_estate', name: 'Real Estate Agent', category: 'Professional Services', searchTerms: ['real estate agent', 'realtor near me', 'real estate broker'] },
  { id: 'insurance', name: 'Insurance Agent', category: 'Professional Services', searchTerms: ['insurance agency', 'insurance broker', 'insurance agent near me'] },
  { id: 'financial_advisor', name: 'Financial Advisor', category: 'Professional Services', searchTerms: ['financial advisor', 'financial planner', 'wealth management'] },
  { id: 'mortgage_broker', name: 'Mortgage Broker', category: 'Professional Services', searchTerms: ['mortgage broker', 'mortgage lender', 'home loan officer'] },
  { id: 'notary', name: 'Notary Public', category: 'Professional Services', searchTerms: ['notary public', 'notary service', 'mobile notary'] },
  { id: 'tax_preparer', name: 'Tax Preparer', category: 'Professional Services', searchTerms: ['tax preparation service', 'tax preparer', 'tax filing service'] },

  // Health & Wellness
  { id: 'dentist', name: 'Dentist', category: 'Health & Wellness', searchTerms: ['dental office', 'dentist near me', 'dental clinic'] },
  { id: 'chiropractor', name: 'Chiropractor', category: 'Health & Wellness', searchTerms: ['chiropractor near me', 'chiropractic clinic', 'back pain specialist'] },
  { id: 'physiotherapist', name: 'Physiotherapist', category: 'Health & Wellness', searchTerms: ['physical therapy', 'physiotherapist near me', 'PT clinic'] },
  { id: 'optometrist', name: 'Optometrist', category: 'Health & Wellness', searchTerms: ['optometrist near me', 'eye doctor', 'eye care center'] },
  { id: 'massage_therapist', name: 'Massage Therapist', category: 'Health & Wellness', searchTerms: ['massage therapy', 'massage therapist near me', 'therapeutic massage'] },
  { id: 'personal_trainer', name: 'Personal Trainer', category: 'Health & Wellness', searchTerms: ['personal trainer near me', 'fitness trainer', 'personal training'] },

  // Automotive
  { id: 'auto_mechanic', name: 'Auto Mechanic', category: 'Automotive', searchTerms: ['auto repair shop', 'car mechanic near me', 'auto service center'] },
  { id: 'auto_body', name: 'Auto Body Shop', category: 'Automotive', searchTerms: ['auto body repair', 'collision repair', 'auto body shop near me'] },
  { id: 'auto_detailing', name: 'Auto Detailing', category: 'Automotive', searchTerms: ['car detailing service', 'auto detailing near me', 'mobile car wash'] },
  { id: 'tire_shop', name: 'Tire Shop', category: 'Automotive', searchTerms: ['tire shop near me', 'tire service', 'tire dealer'] },

  // Personal Care
  { id: 'hair_salon', name: 'Hair Salon / Barber', category: 'Personal Care', searchTerms: ['hair salon near me', 'barber shop', 'hairdresser'] },
  { id: 'nail_salon', name: 'Nail Salon', category: 'Personal Care', searchTerms: ['nail salon near me', 'manicure pedicure', 'nail spa'] },
  { id: 'spa', name: 'Day Spa', category: 'Personal Care', searchTerms: ['day spa near me', 'spa services', 'facial treatment'] },
  { id: 'tattoo', name: 'Tattoo Studio', category: 'Personal Care', searchTerms: ['tattoo shop near me', 'tattoo artist', 'tattoo studio'] },

  // Food & Hospitality
  { id: 'caterer', name: 'Caterer', category: 'Food & Hospitality', searchTerms: ['catering service', 'event catering', 'caterer near me'] },
  { id: 'bakery', name: 'Bakery', category: 'Food & Hospitality', searchTerms: ['bakery near me', 'custom cakes', 'local bakery'] },
  { id: 'food_truck', name: 'Food Truck', category: 'Food & Hospitality', searchTerms: ['food truck', 'mobile food vendor', 'food truck catering'] },

  // Education & Childcare
  { id: 'tutor', name: 'Tutor', category: 'Education & Childcare', searchTerms: ['tutoring service', 'private tutor', 'academic tutoring'] },
  { id: 'daycare', name: 'Daycare / Childcare', category: 'Education & Childcare', searchTerms: ['daycare near me', 'childcare center', 'preschool'] },
  { id: 'driving_school', name: 'Driving School', category: 'Education & Childcare', searchTerms: ['driving school near me', 'driving lessons', 'driving instructor'] },

  // Pet Services
  { id: 'veterinarian', name: 'Veterinarian', category: 'Pet Services', searchTerms: ['vet near me', 'veterinary clinic', 'animal hospital'] },
  { id: 'pet_groomer', name: 'Pet Groomer', category: 'Pet Services', searchTerms: ['pet grooming', 'dog groomer near me', 'pet grooming salon'] },
  { id: 'dog_walker', name: 'Dog Walker / Pet Sitter', category: 'Pet Services', searchTerms: ['dog walking service', 'pet sitter near me', 'dog walker'] },

  // Cleaning & Maintenance
  { id: 'house_cleaner', name: 'House Cleaner', category: 'Cleaning & Maintenance', searchTerms: ['house cleaning service', 'maid service', 'home cleaning'] },
  { id: 'carpet_cleaner', name: 'Carpet Cleaner', category: 'Cleaning & Maintenance', searchTerms: ['carpet cleaning service', 'carpet cleaner near me', 'upholstery cleaning'] },
  { id: 'window_cleaner', name: 'Window Cleaner', category: 'Cleaning & Maintenance', searchTerms: ['window cleaning service', 'window washer', 'window cleaner near me'] },
  { id: 'pest_control', name: 'Pest Control', category: 'Cleaning & Maintenance', searchTerms: ['pest control service', 'exterminator near me', 'pest removal'] },
  { id: 'pool_service', name: 'Pool Service', category: 'Cleaning & Maintenance', searchTerms: ['pool cleaning service', 'pool maintenance', 'pool service near me'] },

  // Specialty Trades
  { id: 'locksmith', name: 'Locksmith', category: 'Specialty Trades', searchTerms: ['locksmith near me', 'locksmith service', 'emergency locksmith'] },
  { id: 'appliance_repair', name: 'Appliance Repair', category: 'Specialty Trades', searchTerms: ['appliance repair service', 'appliance technician', 'washer dryer repair'] },
  { id: 'tree_service', name: 'Tree Service', category: 'Specialty Trades', searchTerms: ['tree removal service', 'tree trimming', 'arborist near me'] },
  { id: 'moving_company', name: 'Moving Company', category: 'Specialty Trades', searchTerms: ['moving company near me', 'local movers', 'moving service'] },
  { id: 'photographer', name: 'Photographer', category: 'Specialty Trades', searchTerms: ['photographer near me', 'photography studio', 'event photographer'] },
  { id: 'event_planner', name: 'Event Planner', category: 'Specialty Trades', searchTerms: ['event planner near me', 'wedding planner', 'event planning service'] },
];

export function getBusinessTypesByCategory(): Record<string, BusinessType[]> {
  const grouped: Record<string, BusinessType[]> = {};
  for (const bt of BUSINESS_TYPES) {
    if (!grouped[bt.category]) grouped[bt.category] = [];
    grouped[bt.category].push(bt);
  }
  return grouped;
}
