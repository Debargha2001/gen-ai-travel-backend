import { z } from "zod";

export const HotelSearchOptionsSchema = z.object({
  cityCode: z.string().min(3).max(3), // IATA city code (e.g. "PAR")
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
  currency: z.string().length(3).optional(), // ISO 4217 code e.g. "USD"
  maxPrice: z.number().min(0).optional(), // max price per night
  maxResults: z.number().min(1).optional(), // limit results
});

export const NormalizedHotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  cityCode: z.string(),
  price: z.string(),
  currency: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
});

export type HotelSearchOptions = z.infer<typeof HotelSearchOptionsSchema>;
export type NormalizedHotel = z.infer<typeof NormalizedHotelSchema>;