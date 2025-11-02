import {z} from "zod";
export const FlightSearchOptionsSchema = z.object({
  from: z.string().min(3).max(3), // origin IATA (e.g. "DEL")
  to: z.string().min(3).max(3), // destination IATA (e.g. "LHR")
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // optional for round trip
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
  infants: z.number().min(0).optional(),
  travelClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
  nonStop: z.boolean().optional(),
  currency: z.string().length(3).optional(), // ISO 4217 code e.g. "USD"
  maxPrice: z.number().min(0).optional(), // max price per traveler
  maxResults: z.number().min(1).optional(), // limit results
});

export const NormalizedFlightSchema = z.object({
  id: z.string(),
  price: z.string(),
  currency: z.string(),
  from: z.string(),
  to: z.string(),
  departure: z.string(),
  arrival: z.string(),
  duration: z.string(),
  airline: z.string(),
  flightNumber: z.string(),
});

export type NormalizedFlight = z.infer<typeof NormalizedFlightSchema>;

export type FlightSearchOptions = z.infer<typeof FlightSearchOptionsSchema>;