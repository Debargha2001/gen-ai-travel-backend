import axios from "axios";
import { config } from "../../utils/config.js";

const AMADEUS_CLIENT_ID = config.get("AMADEUS_CLIENT_ID");
const AMADEUS_CLIENT_SECRET = config.get("AMADEUS_CLIENT_SECRET");

const AMADEUS_OAUTH_TOKEN_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
const AMADEUS_HOTELS_BY_CITY_URL =
  "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city";
const AMADEUS_HOTEL_OFFERS_URL = "https://test.api.amadeus.com/v3/shopping/hotel-offers";

export interface HotelSearchOptions {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  currency?: string;
  maxPrice?: number;
  maxResults?: number;
}

export interface NormalizedHotel {
  id: string;
  name: string;
  address: string;
  cityCode: string;
  price: string;
  currency: string;
  checkIn: string;
  checkOut: string;
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
 * Search Hotels in a city and return normalized offers
 */
export async function searchHotels(options: HotelSearchOptions): Promise<NormalizedHotel[]> {
  const {
    cityCode,
    checkInDate,
    checkOutDate,
    adults = 1,
    currency = "USD",
    maxPrice,
    maxResults = 10,
  } = options;

  try {
    const token = await getAmadeusAccessToken();

    // Step 1: Get hotel IDs by city
    const hotelsRes = await axios.get(AMADEUS_HOTELS_BY_CITY_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: { cityCode },
    });

    const hotelIds: string[] =
      hotelsRes.data?.data?.map((h: { hotelId: string }) => h.hotelId) || [];
    if (!hotelIds.length) {
      throw new Error(`No hotels found for cityCode=${cityCode}`);
    }

    // Limit hotelIds to avoid overly long query strings
    const limitedHotelIds = hotelIds.slice(0, 20).join(",");

    // Step 2: Get offers for these hotel IDs
    const offersRes = await axios.get(AMADEUS_HOTEL_OFFERS_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        hotelIds: limitedHotelIds,
        checkInDate,
        checkOutDate,
        adults,
        currency,
        priceRange: maxPrice ? `0-${maxPrice}` : undefined,
      },
    });

    const data = offersRes.data?.data || [];

    return data.slice(0, maxResults).map(
      (hotel: {
        id: string;
        hotel: { hotelId: string; name: string; address: { lines: string[]; cityCode: string } };
        offers: {
          price: { total: string; currency: string };
          checkInDate: string;
          checkOutDate: string;
        }[];
      }) => {
        const offer = hotel.offers?.[0];
        return {
          id: hotel.hotel?.hotelId || hotel.id,
          name: hotel.hotel?.name,
          address: hotel.hotel?.address?.lines?.join(", "),
          cityCode: hotel.hotel?.address?.cityCode,
          price: offer?.price?.total,
          currency: offer?.price?.currency,
          checkIn: offer?.checkInDate,
          checkOut: offer?.checkOutDate,
        };
      }
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching hotels:", error.response?.data || error.message);
    } else {
      console.error("Error fetching hotels:", error);
    }
    throw error;
  }
}
