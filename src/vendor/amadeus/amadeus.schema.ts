import {z} from "zod";

// Flight-related schemas
export const AmadeusFlightOfferSearchparamsSchema = z.object({
  originLocationCode: z.string().min(3).max(3),
  destinationLocationCode: z.string().min(3).max(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
  infants: z.number().min(0).optional(),
  travelClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
  nonStop: z.boolean().optional(),
  currencyCode: z.string().length(3).optional(),
  maxPrice: z.number().min(0).optional(),
  max: z.number().min(1).optional(),
});

export const AmadeusFlightOfferSchema = z.object({
  id: z.string(),
  price: z.object({
    total: z.string(),
    currency: z.string(),
  }),
  itineraries: z.array(
    z.object({
      duration: z.string(),
      segments: z.array(
        z.object({
          departure: z.object({
            iataCode: z.string(),
            at: z.string(),
          }),
          arrival: z.object({
            iataCode: z.string(),
            at: z.string(),
          }),
          carrierCode: z.string(),
          number: z.string(),
        })
      ),
    })
  ),
});

export const AmadeusFlightResponseSchema = z.object({
  data: z.array(AmadeusFlightOfferSchema).optional(),
});

// Hotel-related schemas
export const AmadeusHotelByCityParamsSchema = z.object({
  cityCode: z.string().min(3).max(3),
});

export const AmadeusHotelByCitySchema = z.object({
  hotelId: z.string(),
  name: z.string().optional(),
  distance: z.object({
    value: z.number(),
    unit: z.string(),
  }).optional(),
});

export const AmadeusHotelByCityResponseSchema = z.object({
  data: z.array(AmadeusHotelByCitySchema).optional(),
});

export const AmadeusHotelOffersParamsSchema = z.object({
  hotelIds: z.string(), // comma-separated string
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  priceRange: z.string().optional(), // e.g. "0-500"
});

export const AmadeusHotelOfferSchema = z.object({
  id: z.string(),
  hotel: z.object({
    hotelId: z.string(),
    name: z.string(),
    address: z.object({
      lines: z.array(z.string()),
      cityCode: z.string(),
      countryCode: z.string().optional(),
    }),
  }),
  offers: z.array(
    z.object({
      price: z.object({
        total: z.string(),
        currency: z.string(),
      }),
      checkInDate: z.string(),
      checkOutDate: z.string(),
      room: z.object({
        type: z.string().optional(),
        typeEstimated: z.object({
          category: z.string().optional(),
          beds: z.number().optional(),
          bedType: z.string().optional(),
        }).optional(),
      }).optional(),
    })
  ),
});

export const AmadeusHotelOffersResponseSchema = z.object({
  data: z.array(AmadeusHotelOfferSchema).optional(),
});

// Type exports
export type AmadeusFlightOfferSearchparams = z.infer<typeof AmadeusFlightOfferSearchparamsSchema>;
export type AmadeusFlightResponse = z.infer<typeof AmadeusFlightResponseSchema>;
export type AmadeusFlightOffer = z.infer<typeof AmadeusFlightOfferSchema>;

export type AmadeusHotelByCityParams = z.infer<typeof AmadeusHotelByCityParamsSchema>;
export type AmadeusHotelByCityResponse = z.infer<typeof AmadeusHotelByCityResponseSchema>;
export type AmadeusHotelOffersParams = z.infer<typeof AmadeusHotelOffersParamsSchema>;
export type AmadeusHotelOffersResponse = z.infer<typeof AmadeusHotelOffersResponseSchema>;
export type AmadeusHotelOffer = z.infer<typeof AmadeusHotelOfferSchema>;