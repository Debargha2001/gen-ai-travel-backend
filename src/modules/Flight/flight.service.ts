import axios from "axios";
import { config } from "../../utils/config.js";

// ---------------- Config ----------------
const AMADEUS_CLIENT_ID = config.get("AMADEUS_CLIENT_ID");
const AMADEUS_CLIENT_SECRET = config.get("AMADEUS_CLIENT_SECRET");
const AMADEUS_OAUTH_TOKEN_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
const AMADEUS_FLIGHT_OFFERS_URL = "https://test.api.amadeus.com/v2/shopping/flight-offers";

// ---------------- Types ----------------
export interface FlightSearchOptions {
  from: string; // origin IATA (e.g. "DEL")
  to: string; // destination IATA (e.g. "LHR")
  departDate: string; // YYYY-MM-DD
  returnDate?: string; // optional for round trip
  adults?: number;
  children?: number;
  infants?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  nonStop?: boolean;
  currency?: string; // ISO 4217 code e.g. "USD"
  maxPrice?: number; // max price per traveler
  maxResults?: number; // limit results
}

export interface NormalizedFlight {
  id: string;
  price: string;
  currency: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  airline: string;
  flightNumber: string;
}

// ---------------- Helpers ----------------
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

// ---------------- Main API ----------------
export async function getFlights(options: FlightSearchOptions): Promise<NormalizedFlight[]> {
  const {
    from,
    to,
    departDate,
    returnDate,
    adults = 1,
    children = 0,
    infants = 0,
    travelClass = "ECONOMY",
    nonStop = false,
    currency = "INR",
    maxPrice = 129999,
    maxResults = 10,
  } = options;

  console.log(options);

  try {
    const token = await getAmadeusAccessToken();

    // Call GET endpoint (simple search)
    const response = await axios.get(AMADEUS_FLIGHT_OFFERS_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: from,
        destinationLocationCode: to,
        departureDate: departDate,
        returnDate,
        adults,
        children,
        infants,
        travelClass,
        nonStop,
        currencyCode: currency,
        maxPrice,
        max: maxResults,
      },
    });

    const data = response.data?.data || [];

    // Normalize response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((offer: any) => {
      const itinerary = offer.itineraries[0];
      const firstSeg = itinerary.segments[0];
      const lastSeg = itinerary.segments[itinerary.segments.length - 1];

      return {
        id: offer.id,
        price: offer.price?.total,
        currency: offer.price?.currency,
        from: firstSeg.departure.iataCode,
        to: lastSeg.arrival.iataCode,
        departure: firstSeg.departure.at,
        arrival: lastSeg.arrival.at,
        duration: itinerary.duration,
        airline: firstSeg.carrierCode,
        flightNumber: firstSeg.number,
      };
    });
  } catch (error) {
    console.error(
      "Error fetching flights:",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.response?.data || (error as Error).message
    );
    throw error;
  }
}
