/**
 * Sports Map data: MLB and NBA teams with their current (2026) home city,
 * venue, and coordinates. Colors are plain hex codes used to draw a simple
 * code-drawn circular badge (color + text abbreviation) — no official logos
 * or trademarked artwork are used anywhere in this file or its renderer.
 */
export type League = "MLB" | "NBA";

export interface SportsTeam {
  id: string;
  league: League;
  /** Full team name, e.g. "New York Yankees". */
  name: string;
  /** Short nickname, e.g. "Yankees". */
  nickname: string;
  /** Home city/market shown to the player, e.g. "New York, NY". */
  city: string;
  venue: string;
  lat: number;
  lon: number;
  /** [primary, secondary] hex colors used by the code-drawn badge. */
  colors: [string, string];
  /** 2-3 letter scoreboard-style abbreviation, e.g. "NYY". */
  abbr: string;
  fact: string;
  /** Marks the two hometown picks (Brewers, Bucks) for a small highlight in the UI. */
  isHometown?: boolean;
}

export const MLB_TEAMS: SportsTeam[] = [
  { id: "mlb-bal", league: "MLB", name: "Baltimore Orioles", nickname: "Orioles", city: "Baltimore, MD", venue: "Oriole Park at Camden Yards", lat: 39.2838, lon: -76.6218, colors: ["#DF4601", "#000000"], abbr: "BAL", fact: "Camden Yards opened in 1992 and kicked off the trend of brick-and-steel 'retro' ballparks." },
  { id: "mlb-bos", league: "MLB", name: "Boston Red Sox", nickname: "Red Sox", city: "Boston, MA", venue: "Fenway Park", lat: 42.3467, lon: -71.0972, colors: ["#BD3039", "#0C2340"], abbr: "BOS", fact: "Fenway Park, opened in 1912, is the oldest ballpark still used in Major League Baseball." },
  { id: "mlb-nyy", league: "MLB", name: "New York Yankees", nickname: "Yankees", city: "New York, NY", venue: "Yankee Stadium", lat: 40.8296, lon: -73.9262, colors: ["#003087", "#C4CED4"], abbr: "NYY", fact: "The Yankees have won more World Series titles than any other MLB team." },
  { id: "mlb-tb", league: "MLB", name: "Tampa Bay Rays", nickname: "Rays", city: "St. Petersburg, FL", venue: "Tropicana Field", lat: 27.7683, lon: -82.6534, colors: ["#092C5C", "#F5D130"], abbr: "TB", fact: "After hurricane damage to Tropicana Field's roof, the Rays played a season of home games across the bay in Tampa." },
  { id: "mlb-tor", league: "MLB", name: "Toronto Blue Jays", nickname: "Blue Jays", city: "Toronto, ON, Canada", venue: "Rogers Centre", lat: 43.6414, lon: -79.3894, colors: ["#134A8E", "#E8291C"], abbr: "TOR", fact: "The Blue Jays are the only MLB team based outside the United States." },
  { id: "mlb-cws", league: "MLB", name: "Chicago White Sox", nickname: "White Sox", city: "Chicago, IL", venue: "Rate Field", lat: 41.8299, lon: -87.6338, colors: ["#000000", "#C4CED4"], abbr: "CWS", fact: "Chicago is home to two MLB teams — the White Sox on the South Side and the Cubs on the North Side." },
  { id: "mlb-cle", league: "MLB", name: "Cleveland Guardians", nickname: "Guardians", city: "Cleveland, OH", venue: "Progressive Field", lat: 41.4962, lon: -81.6852, colors: ["#E31937", "#0C2340"], abbr: "CLE", fact: "The team changed its name from the Indians to the Guardians in 2021, named after the stone statues on a nearby bridge." },
  { id: "mlb-det", league: "MLB", name: "Detroit Tigers", nickname: "Tigers", city: "Detroit, MI", venue: "Comerica Park", lat: 42.339, lon: -83.0485, colors: ["#0C2340", "#FA4616"], abbr: "DET", fact: "Comerica Park features a giant tiger statue and a carousel with hand-carved tigers in the outfield." },
  { id: "mlb-kc", league: "MLB", name: "Kansas City Royals", nickname: "Royals", city: "Kansas City, MO", venue: "Kauffman Stadium", lat: 39.0517, lon: -94.4803, colors: ["#004687", "#BD9B60"], abbr: "KC", fact: "Kauffman Stadium's outfield fountains are one of the most famous sights in baseball." },
  { id: "mlb-min", league: "MLB", name: "Minnesota Twins", nickname: "Twins", city: "Minneapolis, MN", venue: "Target Field", lat: 44.9817, lon: -93.2776, colors: ["#002B5C", "#D31145"], abbr: "MIN", fact: "The Twins' name honors both Minneapolis and St. Paul, the 'Twin Cities.'" },
  { id: "mlb-hou", league: "MLB", name: "Houston Astros", nickname: "Astros", city: "Houston, TX", venue: "Daikin Park", lat: 29.7573, lon: -95.3555, colors: ["#EB6E1F", "#002D62"], abbr: "HOU", fact: "Houston's ballpark has a retractable roof and a real hill in center field, nicknamed Tal's Hill until it was removed in 2017." },
  { id: "mlb-laa", league: "MLB", name: "Los Angeles Angels", nickname: "Angels", city: "Anaheim, CA", venue: "Angel Stadium", lat: 33.8003, lon: -117.8827, colors: ["#BA0021", "#003263"], abbr: "LAA", fact: "Angel Stadium's 'Big A' sign with a halo on top has towered over the Anaheim skyline since 1966." },
  { id: "mlb-ath", league: "MLB", name: "Athletics", nickname: "Athletics", city: "West Sacramento, CA", venue: "Sutter Health Park", lat: 38.6166, lon: -121.5173, colors: ["#003831", "#EFB21E"], abbr: "ATH", fact: "Fun fact: the Athletics plan to move into a brand-new ballpark in Las Vegas, but for now they play in a minor-league park in West Sacramento." },
  { id: "mlb-sea", league: "MLB", name: "Seattle Mariners", nickname: "Mariners", city: "Seattle, WA", venue: "T-Mobile Park", lat: 47.5914, lon: -122.3325, colors: ["#0C2C56", "#005C5C"], abbr: "SEA", fact: "T-Mobile Park's retractable roof doesn't fully enclose the stadium — it just slides over like an umbrella." },
  { id: "mlb-tex", league: "MLB", name: "Texas Rangers", nickname: "Rangers", city: "Arlington, TX", venue: "Globe Life Field", lat: 32.7473, lon: -97.0945, colors: ["#003278", "#C0111F"], abbr: "TEX", fact: "The Rangers won their first World Series title in 2023, in just their second season at Globe Life Field." },
  { id: "mlb-atl", league: "MLB", name: "Atlanta Braves", nickname: "Braves", city: "Atlanta, GA", venue: "Truist Park", lat: 33.8908, lon: -84.4678, colors: ["#CE1141", "#13274F"], abbr: "ATL", fact: "The Braves franchise is one of baseball's oldest, dating back to 1871 in Boston before moving to Milwaukee and then Atlanta." },
  { id: "mlb-mia", league: "MLB", name: "Miami Marlins", nickname: "Marlins", city: "Miami, FL", venue: "loanDepot park", lat: 25.7781, lon: -80.2196, colors: ["#00A3E0", "#000000"], abbr: "MIA", fact: "The Marlins' ballpark has a retractable roof to beat Miami's heat and sudden rainstorms." },
  { id: "mlb-nym", league: "MLB", name: "New York Mets", nickname: "Mets", city: "New York, NY", venue: "Citi Field", lat: 40.7571, lon: -73.8458, colors: ["#002D72", "#FF5910"], abbr: "NYM", fact: "The Mets and Yankees share New York City and play an annual Subway Series against each other." },
  { id: "mlb-phi", league: "MLB", name: "Philadelphia Phillies", nickname: "Phillies", city: "Philadelphia, PA", venue: "Citizens Bank Park", lat: 39.9061, lon: -75.1665, colors: ["#E81828", "#002D72"], abbr: "PHI", fact: "The Phillies' mascot, the Phillie Phanatic, is one of the most famous mascots in all of sports." },
  { id: "mlb-wsh", league: "MLB", name: "Washington Nationals", nickname: "Nationals", city: "Washington, DC", venue: "Nationals Park", lat: 38.873, lon: -77.0074, colors: ["#AB0003", "#14225A"], abbr: "WSH", fact: "Washington's 'Presidents Race' sends giant-headed mascots of former U.S. presidents sprinting around the bases." },
  { id: "mlb-chc", league: "MLB", name: "Chicago Cubs", nickname: "Cubs", city: "Chicago, IL", venue: "Wrigley Field", lat: 41.9484, lon: -87.6553, colors: ["#0E3386", "#CC3433"], abbr: "CHC", fact: "Wrigley Field, opened in 1914, is famous for the ivy growing on its outfield walls." },
  { id: "mlb-cin", league: "MLB", name: "Cincinnati Reds", nickname: "Reds", city: "Cincinnati, OH", venue: "Great American Ball Park", lat: 39.0975, lon: -84.5061, colors: ["#C6011F", "#000000"], abbr: "CIN", fact: "Cincinnati fielded the first fully professional baseball team back in 1869." },
  { id: "mlb-mil", league: "MLB", name: "Milwaukee Brewers", nickname: "Brewers", city: "Milwaukee, WI", venue: "American Family Field", lat: 43.028, lon: -87.9712, colors: ["#0A2351", "#B6922E"], abbr: "MIL", fact: "The Brewers celebrate home runs with a giant slide for their mascot, Bernie Brewer, high above left field.", isHometown: true },
  { id: "mlb-pit", league: "MLB", name: "Pittsburgh Pirates", nickname: "Pirates", city: "Pittsburgh, PA", venue: "PNC Park", lat: 40.4469, lon: -80.0057, colors: ["#FDB827", "#000000"], abbr: "PIT", fact: "PNC Park sits right on the Allegheny River with a postcard view of downtown Pittsburgh." },
  { id: "mlb-stl", league: "MLB", name: "St. Louis Cardinals", nickname: "Cardinals", city: "St. Louis, MO", venue: "Busch Stadium", lat: 38.6226, lon: -90.1928, colors: ["#C41E3A", "#0C2340"], abbr: "STL", fact: "The Cardinals have won the second-most World Series titles of any MLB team." },
  { id: "mlb-ari", league: "MLB", name: "Arizona Diamondbacks", nickname: "D-backs", city: "Phoenix, AZ", venue: "Chase Field", lat: 33.4455, lon: -112.0667, colors: ["#A71930", "#30322C"], abbr: "ARI", fact: "Chase Field has a swimming pool beyond the outfield wall where fans can watch the game." },
  { id: "mlb-col", league: "MLB", name: "Colorado Rockies", nickname: "Rockies", city: "Denver, CO", venue: "Coors Field", lat: 39.7559, lon: -104.9942, colors: ["#333366", "#C4CED4"], abbr: "COL", fact: "Coors Field sits a mile above sea level, and the thin air lets batted balls fly farther than at most parks." },
  { id: "mlb-lad", league: "MLB", name: "Los Angeles Dodgers", nickname: "Dodgers", city: "Los Angeles, CA", venue: "Dodger Stadium", lat: 34.0739, lon: -118.24, colors: ["#005A9C", "#A5ACAF"], abbr: "LAD", fact: "Dodger Stadium, opened in 1962, is the third-oldest ballpark in MLB and the largest by seating capacity." },
  { id: "mlb-sd", league: "MLB", name: "San Diego Padres", nickname: "Padres", city: "San Diego, CA", venue: "Petco Park", lat: 32.7073, lon: -117.1566, colors: ["#2F241D", "#FFC425"], abbr: "SD", fact: "Petco Park blends into San Diego's Gaslamp Quarter, with an old warehouse building forming part of the outfield." },
  { id: "mlb-sf", league: "MLB", name: "San Francisco Giants", nickname: "Giants", city: "San Francisco, CA", venue: "Oracle Park", lat: 37.7786, lon: -122.3893, colors: ["#FD5A1E", "#27251F"], abbr: "SF", fact: "Home runs that splash into the bay beyond Oracle Park's right field wall are called 'Splash Hits.'" },
];

export const NBA_TEAMS: SportsTeam[] = [
  { id: "nba-atl", league: "NBA", name: "Atlanta Hawks", nickname: "Hawks", city: "Atlanta, GA", venue: "State Farm Arena", lat: 33.7573, lon: -84.3963, colors: ["#E03A3E", "#C1D32F"], abbr: "ATL", fact: "The Hawks franchise dates back to 1946, making it one of the NBA's original teams." },
  { id: "nba-bos", league: "NBA", name: "Boston Celtics", nickname: "Celtics", city: "Boston, MA", venue: "TD Garden", lat: 42.3662, lon: -71.0621, colors: ["#007A33", "#BA9653"], abbr: "BOS", fact: "The Celtics have won more NBA championships than any other franchise." },
  { id: "nba-bkn", league: "NBA", name: "Brooklyn Nets", nickname: "Nets", city: "Brooklyn, NY", venue: "Barclays Center", lat: 40.6826, lon: -73.9754, colors: ["#000000", "#707271"], abbr: "BKN", fact: "The Nets moved from New Jersey to a brand-new arena in Brooklyn in 2012." },
  { id: "nba-cha", league: "NBA", name: "Charlotte Hornets", nickname: "Hornets", city: "Charlotte, NC", venue: "Spectrum Center", lat: 35.2251, lon: -80.8392, colors: ["#1D1160", "#00788C"], abbr: "CHA", fact: "Charlotte's original 1988 team was also called the Hornets, a name the franchise brought back in 2014." },
  { id: "nba-chi", league: "NBA", name: "Chicago Bulls", nickname: "Bulls", city: "Chicago, IL", venue: "United Center", lat: 41.8807, lon: -87.6742, colors: ["#CE1141", "#000000"], abbr: "CHI", fact: "The Bulls won six NBA titles in the 1990s behind Michael Jordan." },
  { id: "nba-cle", league: "NBA", name: "Cleveland Cavaliers", nickname: "Cavaliers", city: "Cleveland, OH", venue: "Rocket Arena", lat: 41.4965, lon: -81.6882, colors: ["#860038", "#FDBB30"], abbr: "CLE", fact: "The Cavaliers won their first championship in 2016, coming back from a 3-1 series deficit in the Finals." },
  { id: "nba-dal", league: "NBA", name: "Dallas Mavericks", nickname: "Mavericks", city: "Dallas, TX", venue: "American Airlines Center", lat: 32.7905, lon: -96.8104, colors: ["#00538C", "#B8C4CA"], abbr: "DAL", fact: "The Mavericks won their first NBA title in 2011, upsetting a heavily favored Miami Heat team." },
  { id: "nba-den", league: "NBA", name: "Denver Nuggets", nickname: "Nuggets", city: "Denver, CO", venue: "Ball Arena", lat: 39.7487, lon: -105.0077, colors: ["#0E2240", "#FEC524"], abbr: "DEN", fact: "The Nuggets' name comes from Colorado's gold rush history." },
  { id: "nba-det", league: "NBA", name: "Detroit Pistons", nickname: "Pistons", city: "Detroit, MI", venue: "Little Caesars Arena", lat: 42.3411, lon: -83.0553, colors: ["#C8102E", "#1D42BA"], abbr: "DET", fact: "The Pistons' nickname comes from the automobile pistons made in their original home of Fort Wayne, Indiana." },
  { id: "nba-gsw", league: "NBA", name: "Golden State Warriors", nickname: "Warriors", city: "San Francisco, CA", venue: "Chase Center", lat: 37.768, lon: -122.3877, colors: ["#1D428A", "#FFC72C"], abbr: "GSW", fact: "The Warriors moved across the bay from Oakland to a new San Francisco arena in 2019." },
  { id: "nba-hou", league: "NBA", name: "Houston Rockets", nickname: "Rockets", city: "Houston, TX", venue: "Toyota Center", lat: 29.7508, lon: -95.3621, colors: ["#CE1141", "#000000"], abbr: "HOU", fact: "Houston is nicknamed 'Space City,' home to NASA's Johnson Space Center — hence the Rockets." },
  { id: "nba-ind", league: "NBA", name: "Indiana Pacers", nickname: "Pacers", city: "Indianapolis, IN", venue: "Gainbridge Fieldhouse", lat: 39.7639, lon: -86.1555, colors: ["#002D62", "#FDBB30"], abbr: "IND", fact: "The Pacers' name honors the pace car that leads laps at the Indianapolis 500." },
  { id: "nba-lac", league: "NBA", name: "LA Clippers", nickname: "Clippers", city: "Inglewood, CA", venue: "Intuit Dome", lat: 33.9382, lon: -118.3417, colors: ["#C8102E", "#1D428A"], abbr: "LAC", fact: "The Clippers opened the brand-new Intuit Dome in 2024, their first arena built just for them." },
  { id: "nba-lal", league: "NBA", name: "Los Angeles Lakers", nickname: "Lakers", city: "Los Angeles, CA", venue: "Crypto.com Arena", lat: 34.043, lon: -118.2673, colors: ["#552583", "#FDB927"], abbr: "LAL", fact: "The Lakers' name comes from Minnesota's many lakes, where the team originally played before moving to LA." },
  { id: "nba-mem", league: "NBA", name: "Memphis Grizzlies", nickname: "Grizzlies", city: "Memphis, TN", venue: "FedExForum", lat: 35.1382, lon: -90.0506, colors: ["#5D76A9", "#12173F"], abbr: "MEM", fact: "The Grizzlies moved to Memphis from Vancouver, Canada, in 2001." },
  { id: "nba-mia", league: "NBA", name: "Miami Heat", nickname: "Heat", city: "Miami, FL", venue: "Kaseya Center", lat: 25.7814, lon: -80.187, colors: ["#98002E", "#F9A01B"], abbr: "MIA", fact: "The Heat have won three NBA championships, including back-to-back titles in 2012 and 2013." },
  { id: "nba-mil", league: "NBA", name: "Milwaukee Bucks", nickname: "Bucks", city: "Milwaukee, WI", venue: "Fiserv Forum", lat: 43.0451, lon: -87.9174, colors: ["#00471B", "#EEE1C6"], abbr: "MIL", fact: "The Bucks won the 2021 NBA championship, their first title since 1971.", isHometown: true },
  { id: "nba-min", league: "NBA", name: "Minnesota Timberwolves", nickname: "Timberwolves", city: "Minneapolis, MN", venue: "Target Center", lat: 44.9795, lon: -93.276, colors: ["#0C2340", "#78BE20"], abbr: "MIN", fact: "The Timberwolves brought NBA basketball back to Minnesota in 1989, decades after the Lakers left for LA." },
  { id: "nba-nop", league: "NBA", name: "New Orleans Pelicans", nickname: "Pelicans", city: "New Orleans, LA", venue: "Smoothie King Center", lat: 29.949, lon: -90.0821, colors: ["#0C2340", "#B4975A"], abbr: "NOP", fact: "The brown pelican is Louisiana's state bird, which is how the team got its name." },
  { id: "nba-nyk", league: "NBA", name: "New York Knicks", nickname: "Knicks", city: "New York, NY", venue: "Madison Square Garden", lat: 40.7505, lon: -73.9934, colors: ["#006BB6", "#F58426"], abbr: "NYK", fact: "Madison Square Garden is nicknamed 'The World's Most Famous Arena.'" },
  { id: "nba-okc", league: "NBA", name: "Oklahoma City Thunder", nickname: "Thunder", city: "Oklahoma City, OK", venue: "Paycom Center", lat: 35.4634, lon: -97.5151, colors: ["#007AC1", "#EF3B24"], abbr: "OKC", fact: "The Thunder franchise moved to Oklahoma City from Seattle, where it was known as the SuperSonics, in 2008." },
  { id: "nba-orl", league: "NBA", name: "Orlando Magic", nickname: "Magic", city: "Orlando, FL", venue: "Kia Center", lat: 28.5392, lon: -81.3839, colors: ["#0077C0", "#000000"], abbr: "ORL", fact: "The Magic's name nods to the theme-park magic of their hometown, Orlando." },
  { id: "nba-phi", league: "NBA", name: "Philadelphia 76ers", nickname: "76ers", city: "Philadelphia, PA", venue: "Wells Fargo Center", lat: 39.9012, lon: -75.172, colors: ["#006BB6", "#ED174C"], abbr: "PHI", fact: "The 76ers' name honors 1776, the year the Declaration of Independence was signed in Philadelphia." },
  { id: "nba-phx", league: "NBA", name: "Phoenix Suns", nickname: "Suns", city: "Phoenix, AZ", venue: "Footprint Center", lat: 33.4457, lon: -112.0712, colors: ["#1D1160", "#E56020"], abbr: "PHX", fact: "Phoenix is one of the sunniest cities in the U.S., which inspired the Suns' name." },
  { id: "nba-por", league: "NBA", name: "Portland Trail Blazers", nickname: "Trail Blazers", city: "Portland, OR", venue: "Moda Center", lat: 45.5316, lon: -122.6668, colors: ["#E03A3E", "#000000"], abbr: "POR", fact: "Portland is the only NBA market in Oregon, and the Blazers won their only title in 1977." },
  { id: "nba-sac", league: "NBA", name: "Sacramento Kings", nickname: "Kings", city: "Sacramento, CA", venue: "Golden 1 Center", lat: 38.5802, lon: -121.4997, colors: ["#5A2D81", "#63727A"], abbr: "SAC", fact: "The Kings franchise is the oldest continuously operating team in NBA history, dating back to 1923." },
  { id: "nba-sas", league: "NBA", name: "San Antonio Spurs", nickname: "Spurs", city: "San Antonio, TX", venue: "Frost Bank Center", lat: 29.4269, lon: -98.4375, colors: ["#C4CED4", "#000000"], abbr: "SAS", fact: "The Spurs won five NBA championships between 1999 and 2014." },
  { id: "nba-tor", league: "NBA", name: "Toronto Raptors", nickname: "Raptors", city: "Toronto, ON, Canada", venue: "Scotiabank Arena", lat: 43.6435, lon: -79.3791, colors: ["#CE1141", "#000000"], abbr: "TOR", fact: "The Raptors are the only NBA team based outside the United States, and they won it all in 2019." },
  { id: "nba-uta", league: "NBA", name: "Utah Jazz", nickname: "Jazz", city: "Salt Lake City, UT", venue: "Delta Center", lat: 40.7683, lon: -111.9011, colors: ["#002B5C", "#F9A01B"], abbr: "UTA", fact: "The Jazz kept their name from New Orleans — the city of jazz music — even after moving to Salt Lake City in 1979." },
  { id: "nba-was", league: "NBA", name: "Washington Wizards", nickname: "Wizards", city: "Washington, DC", venue: "Capital One Arena", lat: 38.8981, lon: -77.0209, colors: ["#002B5C", "#E31837"], abbr: "WAS", fact: "The team changed its name from the Bullets to the Wizards in 1997." },
];

export const SPORTS_TEAMS: SportsTeam[] = [...MLB_TEAMS, ...NBA_TEAMS];

export function teamById(id: string): SportsTeam | undefined {
  return SPORTS_TEAMS.find((t) => t.id === id);
}
