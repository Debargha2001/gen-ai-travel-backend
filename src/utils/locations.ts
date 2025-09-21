import axios from "axios";

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || "M74xIz0ntOUn7xU62BqHdmAI2CsZYg8g";
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || "8w6G4v1MIDIcVpR0";

const AMADEUS_OAUTH_TOKEN_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
const AMADEUS_LOCATIONS_URL = "https://test.api.amadeus.com/v1/reference-data/locations";

export interface Location {
  code: string;
  name: string;
  country: string;
}

async function getAmadeusAccessToken(): Promise<string> {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", AMADEUS_CLIENT_ID);
  params.append("client_secret", AMADEUS_CLIENT_SECRET);

  const response = await axios.post(AMADEUS_OAUTH_TOKEN_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data.access_token;
}

/**
 * Get city codes and names
 */
export async function getCityCodes(keyword: string): Promise<Location[]> {
  const token = await getAmadeusAccessToken();

  const res = await axios.get(AMADEUS_LOCATIONS_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      keyword, // e.g. "del" → returns Delhi
      subType: "CITY",
    },
  });

  return (
    res.data?.data?.map(
      (loc: { iataCode: string; name: string; address: { countryName: string } }) => ({
        code: loc.iataCode,
        name: loc.name,
        country: loc.address?.countryName,
      })
    ) || []
  );
}

/**
 * Get airport codes and names
 */
export async function getAirportCodes(keyword: string): Promise<Location[]> {
  const token = await getAmadeusAccessToken();

  const res = await axios.get(AMADEUS_LOCATIONS_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      keyword, // e.g. "del" → returns DEL airport(s)
      subType: "AIRPORT",
    },
  });

  return (
    res.data?.data?.map(
      (loc: { iataCode: string; name: string; address: { countryName: string } }) => ({
        code: loc.iataCode,
        name: loc.name,
        country: loc.address?.countryName,
      })
    ) || []
  );
}
