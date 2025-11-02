import { config } from "../../utils/config.js";
import { makeHttpFormDataCall, makeHttpJsonCall } from "../../utils/makeRequest.js";
import { 
  AmadeusFlightOfferSearchparams, 
  AmadeusFlightResponse,
  AmadeusHotelByCityParams,
  AmadeusHotelByCityResponse,
  AmadeusHotelOffersParams,
  AmadeusHotelOffersResponse
} from "./amadeus.schema.js";

const AMADEUS_CLIENT_ID = config.get("AMADEUS_CLIENT_ID");
const AMADEUS_CLIENT_SECRET = config.get("AMADEUS_CLIENT_SECRET");
const AMADEUS_OAUTH_TOKEN_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
const AMADEUS_FLIGHT_OFFERS_URL = "https://test.api.amadeus.com/v2/shopping/flight-offers";
const AMADEUS_HOTELS_BY_CITY_URL = "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city";
const AMADEUS_HOTEL_OFFERS_URL = "https://test.api.amadeus.com/v3/shopping/hotel-offers";

async function makeEndpoint(
    path: string,
): Promise<{ url: string; headers: Record<string, string> }> {
    const url = new URL(path);
    const token = await getAmadeusAccessToken();

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    return { url: url.href, headers };
}


export async function getAmadeusAccessToken(): Promise<string> {
  const params = {
    grant_type: "client_credentials",
    client_id: AMADEUS_CLIENT_ID,
    client_secret: AMADEUS_CLIENT_SECRET,
  };

  const response = await makeHttpFormDataCall<
    Record<string, string>,
    { access_token: string; token_type: string; expires_in: number }
  >({
    url: AMADEUS_OAUTH_TOKEN_URL,
    method: "post",
    body: params,
  });

  if (response.error) {
    throw new Error(`Failed to get Amadeus access token: ${response.errors.message}`);
  }

  return response.response.body?.access_token || "";
}

export async function getAmadeusFlights(params: AmadeusFlightOfferSearchparams) {
  const { url, headers } = await makeEndpoint(AMADEUS_FLIGHT_OFFERS_URL);
  const response = await makeHttpJsonCall<never, AmadeusFlightResponse>({
    url,
    method: "get",
    headers,
    searchParams: params,
  });

  return response;
}

export async function getAmadeusHotelsByCity(params: AmadeusHotelByCityParams) {
  const { url, headers } = await makeEndpoint(AMADEUS_HOTELS_BY_CITY_URL);
  const response = await makeHttpJsonCall<never, AmadeusHotelByCityResponse>({
    url,
    method: "get",
    headers,
    searchParams: params,
  });

  return response;
}

export async function getAmadeusHotelOffers(params: AmadeusHotelOffersParams) {
  const { url, headers } = await makeEndpoint(AMADEUS_HOTEL_OFFERS_URL);
  const response = await makeHttpJsonCall<never, AmadeusHotelOffersResponse>({
    url,
    method: "get",
    headers,
    searchParams: params,
  });

  return response;
}