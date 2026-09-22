// src/lib/constants/us-cities.ts

export interface USStateCities {
    stateAbbr: string;
    stateName: string;
    cities: string[];
}

export const US_STATE_CITIES: USStateCities[] = [
    {
        stateAbbr: "AL",
        stateName: "Alabama",
        cities: ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa", "Hoover", "Dothan", "Auburn", "Decatur", "Madison", "Florence", "Gadsden", "Vestavia Hills", "Prattville", "Phenix City"],
    },
    {
        stateAbbr: "AK",
        stateName: "Alaska",
        cities: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Wasilla", "Kenai", "Kodiak", "Bethel", "Palmer", "Homer", "Unalaska", "Soldotna", "Barrow", "Nome"],
    },
    {
        stateAbbr: "AZ",
        stateName: "Arizona",
        cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria", "Surprise", "Yuma", "Avondale", "Flagstaff", "Goodyear", "Lake Havasu City", "Buckeye", "Casa Grande", "Prescott", "Sierra Vista", "Maricopa"],
    },
    {
        stateAbbr: "AR",
        stateName: "Arkansas",
        cities: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Pine Bluff", "Bentonville", "Hot Springs", "Benton", "Sherwood", "Texarkana", "Russellville"],
    },
    {
        stateAbbr: "CA",
        stateName: "California",
        cities: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim", "Santa Ana", "Riverside", "Stockton", "Irvine", "Chula Vista", "Fremont", "San Bernardino", "Modesto", "Fontana", "Oxnard", "Moreno Valley", "Huntington Beach", "Glendale", "Santa Clarita", "Garden Grove", "Oceanside", "Rancho Cucamonga", "Santa Rosa", "Ontario", "Lancaster", "Elk Grove", "Corona", "Palmdale", "Salinas", "Pomona", "Hayward", "Escondido", "Torrance", "Sunnyvale", "Orange", "Fullerton", "Pasadena", "Thousand Oaks", "Visalia", "Simi Valley", "Concord", "Roseville", "Victorville", "Santa Clara", "Vallejo"],
    },
    {
        stateAbbr: "CO",
        stateName: "Colorado",
        cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Centennial", "Boulder", "Greeley", "Longmont", "Loveland", "Grand Junction", "Broomfield", "Castle Rock", "Commerce City", "Parker", "Littleton"],
    },
    {
        stateAbbr: "CT",
        stateName: "Connecticut",
        cities: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk", "Danbury", "New Britain", "Meriden", "Bristol", "West Haven", "Milford", "Middletown", "Norwich", "Shelton"],
    },
    {
        stateAbbr: "DE",
        stateName: "Delaware",
        cities: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna", "Milford", "Seaford", "Georgetown", "Elsmere", "New Castle"],
    },
    {
        stateAbbr: "FL",
        stateName: "Florida",
        cities: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral", "Pembroke Pines", "Hollywood", "Miramar", "Coral Springs", "Clearwater", "Miami Gardens", "Palm Bay", "Pompano Beach", "West Palm Beach", "Lakeland", "Davie", "Miami Beach", "Sunrise", "Plantation", "Boca Raton", "Deltona", "Largo", "Deerfield Beach", "Palm Coast", "Melbourne", "Boynton Beach", "Lauderhill", "Weston", "Fort Myers", "Kissimmee", "Homestead", "Tamarac", "Delray Beach", "Daytona Beach", "North Miami", "Wellington", "North Port", "Jupiter", "Ocala", "Port Orange", "Margate", "Coconut Creek", "Sanford", "Sarasota", "Pensacola"],
    },
    {
        stateAbbr: "GA",
        stateName: "Georgia",
        cities: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "Roswell", "Johns Creek", "Albany", "Warner Robins", "Alpharetta", "Marietta", "Valdosta", "Smyrna", "Dunwoody", "Rome", "East Point", "Milton", "Gainesville"],
    },
    {
        stateAbbr: "HI",
        stateName: "Hawaii",
        cities: ["Honolulu", "Pearl City", "Hilo", "Kailua", "Waipahu", "Kaneohe", "Mililani", "Kahului", "Ewa Gentry", "Kapolei", "Kihei", "Makakilo", "Wahiawa", "Schofield Barracks", "Waimalu"],
    },
    {
        stateAbbr: "ID",
        stateName: "Idaho",
        cities: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello", "Caldwell", "Coeur d'Alene", "Twin Falls", "Lewiston", "Post Falls", "Rexburg", "Eagle", "Moscow", "Kuna", "Ammon"],
    },
    {
        stateAbbr: "IL",
        stateName: "Illinois",
        cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Elgin", "Peoria", "Champaign", "Waukegan", "Cicero", "Bloomington", "Arlington Heights", "Evanston", "Decatur", "Schaumburg", "Bolingbrook", "Palatine", "Skokie", "Des Plaines", "Orland Park", "Tinley Park", "Oak Lawn", "Berwyn", "Mount Prospect", "Normal", "Wheaton", "Hoffman Estates", "Oak Park", "Downers Grove"],
    },
    {
        stateAbbr: "IN",
        stateName: "Indiana",
        cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond", "Gary", "Muncie", "Lafayette", "Terre Haute", "Kokomo", "Anderson", "Noblesville", "Greenwood", "Elkhart", "Mishawaka", "Lawrence", "Jeffersonville"],
    },
    {
        stateAbbr: "IA",
        stateName: "Iowa",
        cities: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Council Bluffs", "Ames", "West Des Moines", "Dubuque", "Ankeny", "Urbandale", "Cedar Falls", "Marion", "Bettendorf"],
    },
    {
        stateAbbr: "KS",
        stateName: "Kansas",
        cities: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Manhattan", "Lenexa", "Salina", "Hutchinson", "Leavenworth", "Leawood", "Dodge City", "Garden City"],
    },
    {
        stateAbbr: "KY",
        stateName: "Kentucky",
        cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Richmond", "Georgetown", "Florence", "Elizabethtown", "Hopkinsville", "Nicholasville", "Henderson", "Jeffersontown", "Frankfort", "Paducah"],
    },
    {
        stateAbbr: "LA",
        stateName: "Louisiana",
        cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Kenner", "Bossier City", "Monroe", "Alexandria", "Houma", "New Iberia", "Slidell", "Prairieville", "Central", "Ruston"],
    },
    {
        stateAbbr: "ME",
        stateName: "Maine",
        cities: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Saco", "Augusta", "Westbrook", "Waterville", "Presque Isle", "Brewer", "Bath", "Caribou"],
    },
    {
        stateAbbr: "MD",
        stateName: "Maryland",
        cities: ["Baltimore", "Columbia", "Germantown", "Silver Spring", "Waldorf", "Glen Burnie", "Ellicott City", "Frederick", "Dundalk", "Rockville", "Bethesda", "Gaithersburg", "Bowie", "Hagerstown", "Annapolis", "Towson", "Salisbury", "Aspen Hill", "Wheaton", "Potomac"],
    },
    {
        stateAbbr: "MA",
        stateName: "Massachusetts",
        cities: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton", "Quincy", "Lynn", "New Bedford", "Fall River", "Newton", "Lawrence", "Somerville", "Framingham", "Haverhill", "Waltham", "Malden", "Brookline", "Plymouth", "Medford"],
    },
    {
        stateAbbr: "MI",
        stateName: "Michigan",
        cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Flint", "Dearborn", "Livonia", "Clinton Township", "Canton", "Westland", "Troy", "Farmington Hills", "Macomb Township", "Kalamazoo", "Shelby Township", "Wyoming", "Southfield", "Rochester Hills"],
    },
    {
        stateAbbr: "MN",
        stateName: "Minnesota",
        cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park", "Plymouth", "St. Cloud", "Eagan", "Woodbury", "Maple Grove", "Eden Prairie", "Coon Rapids", "Burnsville", "Blaine", "Lakeville", "Minnetonka", "Apple Valley", "Edina", "St. Louis Park"],
    },
    {
        stateAbbr: "MS",
        stateName: "Mississippi",
        cities: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi", "Meridian", "Tupelo", "Greenville", "Olive Branch", "Horn Lake", "Clinton", "Pearl", "Madison", "Ridgeland", "Starkville"],
    },
    {
        stateAbbr: "MO",
        stateName: "Missouri",
        cities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "St. Peters", "Blue Springs", "Florissant", "Joplin", "Chesterfield", "Jefferson City", "Cape Girardeau", "Wildwood", "University City", "Ballwin", "Raytown"],
    },
    {
        stateAbbr: "MT",
        stateName: "Montana",
        cities: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City", "Belgrade", "Livingston", "Laurel", "Whitefish", "Lewistown"],
    },
    {
        stateAbbr: "NE",
        stateName: "Nebraska",
        cities: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "Norfolk", "Columbus", "Papillion", "North Platte", "La Vista", "Scottsbluff", "South Sioux City", "Beatrice"],
    },
    {
        stateAbbr: "NV",
        stateName: "Nevada",
        cities: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Fernley", "Elko", "Mesquite", "Boulder City", "Fallon", "Winnemucca", "West Wendover", "Ely", "Yerington"],
    },
    {
        stateAbbr: "NH",
        stateName: "New Hampshire",
        cities: ["Manchester", "Nashua", "Concord", "Derry", "Rochester", "Salem", "Dover", "Merrimack", "Londonderry", "Hudson", "Keene", "Bedford", "Portsmouth", "Goffstown", "Laconia"],
    },
    {
        stateAbbr: "NJ",
        stateName: "New Jersey",
        cities: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Lakewood", "Toms River", "Hamilton", "Trenton", "Clifton", "Camden", "Brick", "Cherry Hill", "Passaic", "Union City", "Middletown", "Old Bridge", "Gloucester Township", "East Orange", "Bayonne", "Franklin Township", "North Bergen", "Vineland", "Union", "Piscataway", "New Brunswick", "Jackson", "Wayne", "Irvington"],
    },
    {
        stateAbbr: "NM",
        stateName: "New Mexico",
        cities: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "Clovis", "Hobbs", "Alamogordo", "Carlsbad", "Gallup", "Deming", "Los Lunas", "Chaparral", "Sunland Park"],
    },
    {
        stateAbbr: "NY",
        stateName: "New York",
        cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica", "White Plains", "Hempstead", "Troy", "Niagara Falls", "Binghamton", "Freeport", "Valley Stream", "Long Beach", "Spring Valley", "Poughkeepsie", "Newburgh", "Ithaca", "Elmira", "Watertown", "Jamestown", "Saratoga Springs", "Middletown", "Plattsburgh", "Beacon", "Kingston"],
    },
    {
        stateAbbr: "NC",
        stateName: "North Carolina",
        cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Greenville", "Asheville", "Concord", "Gastonia", "Jacksonville", "Chapel Hill", "Rocky Mount", "Burlington", "Wilson", "Huntersville", "Kannapolis"],
    },
    {
        stateAbbr: "ND",
        stateName: "North Dakota",
        cities: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton", "Devils Lake", "Valley City", "Grafton", "Beulah", "Rugby"],
    },
    {
        stateAbbr: "OH",
        stateName: "Ohio",
        cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain", "Hamilton", "Springfield", "Kettering", "Elyria", "Lakewood", "Cuyahoga Falls", "Middletown", "Euclid", "Newark", "Mansfield", "Mentor", "Beavercreek", "Cleveland Heights", "Strongsville", "Dublin", "Fairfield", "Findlay", "Warren", "Lancaster", "Lima"],
    },
    {
        stateAbbr: "OK",
        stateName: "Oklahoma",
        cities: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond", "Lawton", "Moore", "Midwest City", "Enid", "Stillwater", "Muskogee", "Bartlesville", "Owasso", "Shawnee", "Ponca City", "Ardmore", "Duncan", "Yukon", "Del City", "Sapulpa"],
    },
    {
        stateAbbr: "OR",
        stateName: "Oregon",
        cities: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Beaverton", "Bend", "Medford", "Springfield", "Corvallis", "Albany", "Tigard", "Lake Oswego", "Keizer", "Grants Pass", "Oregon City", "McMinnville", "Redmond", "Tualatin", "West Linn"],
    },
    {
        stateAbbr: "PA",
        stateName: "Pennsylvania",
        cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona", "York", "State College", "Wilkes-Barre", "Chester", "Williamsport", "Easton", "Lebanon", "Hazleton", "New Castle", "Johnstown"],
    },
    {
        stateAbbr: "RI",
        stateName: "Rhode Island",
        cities: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Woonsocket", "Coventry", "Cumberland", "North Providence", "South Kingstown", "West Warwick", "Johnston", "North Kingstown", "Newport", "Bristol"],
    },
    {
        stateAbbr: "SC",
        stateName: "South Carolina",
        cities: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Sumter", "Goose Creek", "Hilton Head Island", "Florence", "Spartanburg", "Myrtle Beach", "Aiken", "Anderson"],
    },
    {
        stateAbbr: "SD",
        stateName: "South Dakota",
        cities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Pierre", "Huron", "Vermillion", "Spearfish", "Brandon", "Box Elder", "Madison", "Sturgis"],
    },
    {
        stateAbbr: "TN",
        stateName: "Tennessee",
        cities: ["Memphis", "Nashville", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Bartlett", "Hendersonville", "Kingsport", "Collierville", "Smyrna", "Cleveland", "Germantown", "Brentwood", "Columbia", "La Vergne", "Gallatin"],
    },
    {
        stateAbbr: "TX",
        stateName: "Texas",
        cities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo", "Lubbock", "Garland", "Irving", "Amarillo", "Grand Prairie", "Brownsville", "Pasadena", "McKinney", "Mesquite", "McAllen", "Killeen", "Frisco", "Waco", "Carrollton", "Denton", "Midland", "Abilene", "Beaumont", "Round Rock", "Odessa", "Wichita Falls", "Richardson", "Lewisville", "Tyler", "College Station", "Pearland", "San Angelo", "Allen", "League City", "Sugar Land", "Longview", "Edinburg", "Mission", "Bryan", "Baytown", "Pharr", "Temple", "Missouri City", "Flower Mound", "Harlingen"],
    },
    {
        stateAbbr: "UT",
        stateName: "Utah",
        cities: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden", "St. George", "Layton", "Taylorsville", "South Jordan", "Lehi", "Logan", "Murray", "Draper", "Bountiful", "Riverton", "Roy", "Spanish Fork", "Pleasant Grove"],
    },
    {
        stateAbbr: "VT",
        stateName: "Vermont",
        cities: ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier", "Winooski", "St. Albans", "Newport", "Vergennes", "Brattleboro", "Hartford", "Colchester", "Essex", "Bennington", "Milton"],
    },
    {
        stateAbbr: "VA",
        stateName: "Virginia",
        cities: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Roanoke", "Portsmouth", "Suffolk", "Lynchburg", "Harrisonburg", "Leesburg", "Charlottesville", "Danville", "Blacksburg", "Manassas", "Petersburg", "Fredericksburg", "Winchester"],
    },
    {
        stateAbbr: "WA",
        stateName: "Washington",
        cities: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Yakima", "Federal Way", "Spokane Valley", "Bellingham", "Kennewick", "Auburn", "Pasco", "Marysville", "Lakewood", "Redmond", "Shoreline", "Richland", "Kirkland", "Burien", "Sammamish", "Olympia", "Lacey", "Edmonds", "Bremerton", "Puyallup", "Lynnwood", "Bothell"],
    },
    {
        stateAbbr: "WV",
        stateName: "West Virginia",
        cities: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling", "Weirton", "Fairmont", "Martinsburg", "Beckley", "Clarksburg", "South Charleston", "St. Albans", "Vienna", "Bluefield", "Moundsville"],
    },
    {
        stateAbbr: "WI",
        stateName: "Wisconsin",
        cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Eau Claire", "Oshkosh", "Janesville", "West Allis", "La Crosse", "Sheboygan", "Wauwatosa", "Fond du Lac", "New Berlin", "Wausau", "Brookfield", "Greenfield", "Beloit"],
    },
    {
        stateAbbr: "WY",
        stateName: "Wyoming",
        cities: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Jackson", "Cody", "Rawlins", "Lander", "Torrington", "Powell"],
    },
    {
        stateAbbr: "DC",
        stateName: "District of Columbia",
        cities: ["Washington"],
    },
];

// Helper function to get cities for a state by abbreviation or name
export function getCitiesForState(stateQuery: string): string[] {
    const normalized = stateQuery.trim().toLowerCase();
    const stateData = US_STATE_CITIES.find(
        (s) =>
            s.stateAbbr.toLowerCase() === normalized ||
            s.stateName.toLowerCase() === normalized
    );
    return stateData ? stateData.cities : [];
}

// Helper function to get all cities (useful for search)
export function getAllCities(): string[] {
    const allCities: string[] = [];
    US_STATE_CITIES.forEach((state) => {
        allCities.push(...state.cities);
    });
    return allCities.sort();
}

// Helper function to find the state for a given city
export function getStateForCity(cityQuery: string): { stateAbbr: string, stateName: string } | undefined {
    const normalized = cityQuery.trim().toLowerCase();
    const stateData = US_STATE_CITIES.find(s =>
        s.cities.some(c => c.toLowerCase() === normalized)
    );
    return stateData ? { stateAbbr: stateData.stateAbbr, stateName: stateData.stateName } : undefined;
}
