// Common US cities for autocomplete
export const US_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
  'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville',
  'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
  'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
  'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs',
  'Raleigh', 'Miami', 'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis',
  'Tulsa', 'Arlington', 'Tampa', 'New Orleans', 'Wichita', 'Cleveland',
  'Bakersfield', 'Aurora', 'Anaheim', 'Honolulu', 'Santa Ana', 'Corpus Christi',
  'Riverside', 'Lexington', 'Stockton', 'Henderson', 'Saint Paul', 'St. Louis',
  'Milwaukee', 'Milwaukee', 'Milwaukee', 'Milwaukee', 'Milwaukee', 'Milwaukee',
  'Dekalb', 'Champaign', 'Urbana', 'Bloomington', 'Normal', 'Carbondale',
  'Edwardsville', 'Charleston', 'Macomb', 'Peoria', 'Rockford', 'Springfield'
];

// Common US universities for autocomplete
export const US_UNIVERSITIES = [
  'University of Illinois at Urbana-Champaign', 'University of Illinois at Chicago',
  'University of Illinois at Springfield', 'Northern Illinois University',
  'Illinois State University', 'Southern Illinois University',
  'Western Illinois University', 'Eastern Illinois University',
  'Northeastern Illinois University', 'Chicago State University',
  'Governors State University', 'University of Chicago',
  'Northwestern University', 'DePaul University', 'Loyola University Chicago',
  'Illinois Institute of Technology', 'Roosevelt University',
  'Columbia College Chicago', 'Benedictine University',
  'Elmhurst University', 'Aurora University', 'Lewis University',
  'North Central College', 'Olivet Nazarene University',
  'Quincy University', 'Rockford University', 'Saint Xavier University',
  'University of St. Francis', 'Wheaton College', 'Bradley University',
  'Illinois Wesleyan University', 'Knox College', 'Lake Forest College',
  'Monmouth College', 'Principia College', 'University of Illinois at Chicago',
  'Harvard University', 'Stanford University', 'Massachusetts Institute of Technology',
  'California Institute of Technology', 'Princeton University', 'Yale University',
  'Columbia University', 'University of Pennsylvania', 'Duke University',
  'Johns Hopkins University', 'Northwestern University', 'Brown University',
  'Cornell University', 'Rice University', 'Vanderbilt University',
  'Washington University in St. Louis', 'Emory University', 'Georgetown University',
  'Carnegie Mellon University', 'University of Southern California',
  'University of California, Berkeley', 'University of California, Los Angeles',
  'University of Michigan', 'University of Virginia', 'University of North Carolina',
  'Wake Forest University', 'New York University', 'Boston University',
  'Northeastern University', 'Tulane University', 'University of Miami',
  'University of Florida', 'University of Georgia', 'Georgia Institute of Technology',
  'University of Texas at Austin', 'Texas A&M University', 'Rice University',
  'University of Washington', 'University of Oregon', 'Oregon State University',
  'University of Colorado Boulder', 'University of Utah', 'Arizona State University',
  'University of Arizona', 'University of Nevada, Las Vegas', 'University of Hawaii',
  'University of Alaska', 'University of Montana', 'University of Wyoming',
  'University of North Dakota', 'University of South Dakota', 'University of Nebraska',
  'University of Kansas', 'University of Oklahoma', 'University of Arkansas',
  'University of Missouri', 'University of Iowa', 'University of Wisconsin',
  'University of Minnesota', 'University of North Dakota', 'University of South Dakota',
  'University of Nebraska', 'University of Kansas', 'University of Oklahoma',
  'University of Arkansas', 'University of Missouri', 'University of Iowa',
  'University of Wisconsin', 'University of Minnesota'
];

// Function to search cities with API fallback
export const searchCities = async (query) => {
  if (query.length < 2) return [];
  
  // First try local data
  const localResults = US_CITIES.filter(city =>
    city.toLowerCase().includes(query.toLowerCase())
  );
  
  if (localResults.length >= 5) {
    return localResults.slice(0, 5);
  }
  
  // If we need more results, we could call an external API here
  // For now, return local results
  return localResults;
};

// Function to search universities with API fallback
export const searchUniversities = async (query) => {
  if (query.length < 2) return [];
  
  // First try local data
  const localResults = US_UNIVERSITIES.filter(university =>
    university.toLowerCase().includes(query.toLowerCase())
  );
  
  if (localResults.length >= 5) {
    return localResults.slice(0, 5);
  }
  
  // If we need more results, we could call an external API here
  // For now, return local results
  return localResults;
};
