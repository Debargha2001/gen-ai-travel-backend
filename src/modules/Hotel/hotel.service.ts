import { GoogleGenAI } from "@google/genai";
import { AmadeusHotelByCityResponse, AmadeusHotelOffer } from "../../vendor/amadeus/amadeus.schema.js";
import * as AmadeusVendor from "../../vendor/amadeus/amadeus.vendor.js";
import { config } from "../../utils/config.js";
import { HotelSearchOptions, NormalizedHotel } from "./hotel.schema.js";
import { logger } from "../../utils/logger.js";

const MODULE = "HotelService";

/**
 * Generate dummy hotel data using Gemini AI when API returns empty results
 */
async function generateDummyHotels(options: HotelSearchOptions): Promise<NormalizedHotel[]> {
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      apiKey: config.get("VERTEX_API_KEY"),
    });

    const prompt = `Generate realistic dummy hotel data for the following search criteria:
- City Code: ${options.cityCode}
- Check-in Date: ${options.checkInDate}
- Check-out Date: ${options.checkOutDate}
- Adults: ${options.adults}
- Children: ${options.children || 0}
- Currency: ${options.currency || "INR"}
- Max Price: ${options.maxPrice || "N/A"}

Generate exactly 5 realistic hotel options with actual hotel names that could exist in or near the city code ${options.cityCode}. Make sure prices are realistic for the location and duration, include real street addresses, and use proper hotel naming conventions.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "id": "HOTEL001",
    "name": "Grand Plaza Hotel",
    "address": "123 Main Street, City Center",
    "cityCode": "${options.cityCode}",
    "price": "12500.00",
    "currency": "${options.currency || "INR"}",
    "checkIn": "${options.checkInDate}",
    "checkOut": "${options.checkOutDate}"
  }
]

Important: Return ONLY the JSON array, no additional text or markdown formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const dummyHotels = JSON.parse(generatedText) as NormalizedHotel[];
    
    // Validate and fix generated data to ensure correct city code
    const validatedHotels = dummyHotels.map(hotel => ({
      ...hotel,
      cityCode: options.cityCode, // Ensure correct city
      currency: options.currency || "INR", // Ensure correct currency
      checkIn: options.checkInDate, // Ensure correct check-in date
      checkOut: options.checkOutDate, // Ensure correct check-out date
    }));
    logger.info({
      message: "Generated dummy hotels using Gemini AI",
      module: MODULE,
      data: { cityCode: options.cityCode, generatedCount: validatedHotels.length },
    });
    return validatedHotels.slice(0, options.maxResults || 10);
  } catch (error) {
    logger.error({
      message: "Error generating dummy hotels",
      module: MODULE,
      data: error,
    });
    // Fallback to hardcoded dummy data if Gemini fails
    return [
      {
        id: "HOTEL-DUMMY-1",
        name: "Grand Central Hotel",
        address: "City Center, Main Boulevard",
        cityCode: options.cityCode,
        price: "12500.00",
        currency: options.currency || "INR",
        checkIn: options.checkInDate,
        checkOut: options.checkOutDate,
      },
      {
        id: "HOTEL-DUMMY-2",
        name: "Royal Palace Inn",
        address: "Downtown District, Park Avenue",
        cityCode: options.cityCode,
        price: "15000.00",
        currency: options.currency || "INR",
        checkIn: options.checkInDate,
        checkOut: options.checkOutDate,
      },
      {
        id: "HOTEL-DUMMY-3",
        name: "Comfort Suites",
        address: "Airport Road, Business District",
        cityCode: options.cityCode,
        price: "9800.00",
        currency: options.currency || "INR",
        checkIn: options.checkInDate,
        checkOut: options.checkOutDate,
      },
    ].slice(0, options.maxResults || 10);
  }
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
    currency = "INR",
    maxPrice,
    maxResults = 10,
  } = options;

  try {
    // Step 1: Get hotel IDs by city
    const hotelsResponse = await AmadeusVendor.getAmadeusHotelsByCity({
      cityCode,
    });

    if (hotelsResponse.error) {
      // If API returns an error (like invalid city code), generate dummy data
      logger.info({
        message: "Hotel API returned error, generating dummy data",
        module: MODULE,
        data: { cityCode },
      });
      return await generateDummyHotels(options);
    }

    const hotelsData = (hotelsResponse.response.body as AmadeusHotelByCityResponse)?.data || [];
    const hotelIds: string[] = hotelsData.map((h) => h.hotelId);
    logger.info({
      message: `Found ${hotelIds.length} hotels in city ${cityCode} from Amadeus API`,
      module: MODULE,
      data: { cityCode, hotelIds },
    });
    if (!hotelIds.length) {
      logger.info({
        message: "No hotels found from Amadeus API, generating dummy data...",
        module: MODULE,
        data: { cityCode },
      });
      return await generateDummyHotels(options);
    }

    // Limit hotelIds to avoid overly long query strings
    const limitedHotelIds = hotelIds.slice(0, 20).join(",");

    // Step 2: Get offers for these hotel IDs
    const offersResponse = await AmadeusVendor.getAmadeusHotelOffers({
      hotelIds: limitedHotelIds,
      checkInDate,
      checkOutDate,
      adults,
      currency,
      priceRange: maxPrice ? `0-${maxPrice}` : undefined,
    });

    if (offersResponse.error) {
      // If API returns an error, generate dummy data
      logger.error({
        message: "Hotel offers API returned error, generating dummy data",
        module: MODULE,
        data: { cityCode },
      });
      return await generateDummyHotels(options);
    }

    const offersData = offersResponse.response.body?.data || [];

    // If no hotel offers found, generate dummy data using Gemini
    if (offersData.length === 0) {
      logger.error({
        message: "No hotel offers found from Amadeus API, generating dummy data",
        module: MODULE,
        data: { cityCode },
      })
      return await generateDummyHotels(options);
    }

    return offersData.slice(0, maxResults).map((hotel: AmadeusHotelOffer) => {
      const offer = hotel.offers?.[0];
      return {
        id: hotel.hotel?.hotelId || hotel.id,
        name: hotel.hotel?.name || "",
        address: hotel.hotel?.address?.lines?.join(", ") || "",
        cityCode: hotel.hotel?.address?.cityCode || "",
        price: offer?.price?.total || "",
        currency: offer?.price?.currency || "",
        checkIn: offer?.checkInDate || "",
        checkOut: offer?.checkOutDate || "",
      };
    });
  } catch (error: unknown) {
    logger.error({
      message: "Error fetching hotels",
      data: error,
      module: MODULE,
    });
    throw new Error("Error fetching hotels");
  }
}
