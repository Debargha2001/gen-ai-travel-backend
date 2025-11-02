import { GoogleGenAI } from "@google/genai";
import { AmadeusFlightOffer, AmadeusFlightResponse } from "../../vendor/amadeus/amadeus.schema.js";
import * as AmadeusVendor from "../../vendor/amadeus/amadeus.vendor.js";
import { config } from "../../utils/config.js";
import { FlightSearchOptions, NormalizedFlight } from "./flight.schema.js";
import { logger } from "../../utils/logger.js";

const MODULE = "FlightService";

/**
 * Generate dummy flight data using Gemini AI when API returns empty results
 */
async function generateDummyFlights(options: FlightSearchOptions): Promise<NormalizedFlight[]> {
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      apiKey: config.get("VERTEX_API_KEY"),
    });

    const prompt = `Generate realistic dummy flight data for the following search criteria:
- From: ${options.from}
- To: ${options.to}
- Departure Date: ${options.departDate}
- Return Date: ${options.returnDate || "N/A"}
- Adults: ${options.adults}
- Children: ${options.children || 0}
- Infants: ${options.infants || 0}
- Travel Class: ${options.travelClass || "ECONOMY"}
- Currency: ${options.currency || "INR"}

Generate exactly 5 realistic flight options with the following structure. Make sure prices are realistic for the route, use actual airline codes (like AI, 6E, UK, SG, etc.), and generate proper ISO datetime strings for departure and arrival times. The duration should be in ISO 8601 duration format (e.g., PT2H30M for 2 hours 30 minutes).

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "id": "1",
    "price": "15000.00",
    "currency": "${options.currency || "INR"}",
    "from": "${options.from}",
    "to": "${options.to}",
    "departure": "2025-11-15T06:00:00",
    "arrival": "2025-11-15T08:30:00",
    "duration": "PT2H30M",
    "airline": "6E",
    "flightNumber": "2301"
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
    const dummyFlights = JSON.parse(generatedText) as NormalizedFlight[];
    
    // Validate and fix generated data to ensure correct airports
    const validatedFlights = dummyFlights.map(flight => ({
      ...flight,
      from: options.from, // Ensure correct origin
      to: options.to, // Ensure correct destination
      currency: options.currency || "INR", // Ensure correct currency
    }));
    
    logger.info({
      message: "Generated dummy flights using Gemini AI",
      module: MODULE,
      data: { from: options.from, to: options.to, departDate: options.departDate },
    });
    return validatedFlights.slice(0, options.maxResults || 10);
  } catch (error) {
    logger.error({
      message: "Error generating dummy flights",
      module: MODULE,
      data: error,
    });
    // Fallback to hardcoded dummy data if Gemini fails
    return [
      {
        id: "dummy-1",
        price: "15000.00",
        currency: options.currency || "INR",
        from: options.from,
        to: options.to,
        departure: `${options.departDate}T06:00:00`,
        arrival: `${options.departDate}T08:30:00`,
        duration: "PT2H30M",
        airline: "6E",
        flightNumber: "2301",
      },
      {
        id: "dummy-2",
        price: "18000.00",
        currency: options.currency || "INR",
        from: options.from,
        to: options.to,
        departure: `${options.departDate}T10:00:00`,
        arrival: `${options.departDate}T12:45:00`,
        duration: "PT2H45M",
        airline: "AI",
        flightNumber: "505",
      },
      {
        id: "dummy-3",
        price: "12500.00",
        currency: options.currency || "INR",
        from: options.from,
        to: options.to,
        departure: `${options.departDate}T14:30:00`,
        arrival: `${options.departDate}T17:00:00`,
        duration: "PT2H30M",
        airline: "UK",
        flightNumber: "701",
      },
    ].slice(0, options.maxResults || 10);
  }
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

  logger.info({
    message: "Fetching flights with options",
    data: options,
    module: MODULE,
  });

  try {

    // Call GET endpoint (simple search)
    const response = await AmadeusVendor.getAmadeusFlights({
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
    });

    if (response.error) {
      // If API returns an error (like invalid airport codes), generate dummy data
      logger.error({
        message: "Flight API returned error, generating dummy data",
        module: MODULE,
        data: { from, to, departDate },
      });
      return await generateDummyFlights(options);
    }

    const data = (response.response.body as AmadeusFlightResponse)?.data || [];

    // If no flights found, generate dummy data using Gemini
    if (data.length === 0) {
      logger.error({
        message: "No flights found from Amadeus API, generating dummy data",
        module: MODULE,
        data: { from, to, departDate },
      })
      return await generateDummyFlights(options);
    }

    // Normalize response
    return data.map((offer: AmadeusFlightOffer) => {
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
    logger.error({
      message: "Error fetching flights",
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.response?.data || (error as Error).message,
      },
      module: MODULE,
    });
    throw new Error("Error fetching flights");
  }
}
