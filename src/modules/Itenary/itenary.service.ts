import {
  GoogleGenAI,
  Type,
  type FunctionDeclaration,
  type GenerateContentParameters,
  GenerateContentResponse,
  type Tool,
  type ToolConfig,
  type Part,
} from "@google/genai";
import { getFlights, type NormalizedFlight } from "../Flight/flight.service.js";
import { searchHotels, type NormalizedHotel } from "../Hotel/hotel.service.js";
import { config } from "../../utils/config.js";

export interface TravelAssistantReply {
  reply: string;
  data?: unknown;
  done?: boolean;
}

// Define the function declarations (tools)
const getFlightsFunction: FunctionDeclaration = {
  name: "getFlights",
  description: "Search available flights between two locations",
  parameters: {
    type: Type.OBJECT,
    properties: {
      from: {
        type: Type.STRING,
        description: "Origin airport or city code use only airport codes like CCU,BOM,..",
      },
      to: {
        type: Type.STRING,
        description: "Destination airport or city code use only airport codes like CCU,BOM,..",
      },
      departDate: {
        type: Type.STRING,
        description: "Departure date in YYYY-MM-DD",
      },
      returnDate: {
        type: Type.STRING,
        description: "Return date in YYYY-MM-DD, optional",
      },
      adults: { type: Type.NUMBER, description: "Number of adult passengers" },
      children: {
        type: Type.NUMBER,
        description: "Number of child passengers (optional)",
      },
    },
    required: ["from", "to", "departDate", "adults"],
  },
};

const confirmBooking: FunctionDeclaration = {
  name: "confirmBooking",
  description: "All itinenary or required things are done",
  parameters: {
    type: Type.OBJECT,
    properties: {
      bookingBreakDown: {
        type: Type.STRING,
        description: "full breakdown of costs of flights/hotels/trip's other costs.",
      },
      
    },
    required: ["bookingBreakDown"],
  },
};

const searchHotelsFunction: FunctionDeclaration = {
  name: "searchHotels",
  description: "Search available hotels in a city",
  parameters: {
    type: Type.OBJECT,
    properties: {
      cityCode: {
        type: Type.STRING,
        description: "City code or city identifier use only  airport codes like CCU,BOM,..",
      },
      checkInDate: {
        type: Type.STRING,
        description: "Check-in date in YYYY-MM-DD",
      },
      checkOutDate: {
        type: Type.STRING,
        description: "Check-out date in YYYY-MM-DD",
      },
      adults: { type: Type.NUMBER, description: "Number of adults" },
      children: {
        type: Type.NUMBER,
        description: "Number of children (optional)",
      },
    },
    required: ["cityCode", "checkInDate", "checkOutDate", "adults"],
  },
};

const SYSTEM_PROMPT = `You are Roxy, an AI travel assistant for EazyMyTrip. Your job is to help users plan complete, personalized trips by generating itineraries, suggesting hotels, and recommending flights. You should:

1. Collect all necessary information from the user to plan their trip, including:
   - Departure location
   - Destination
   - Travel dates (start and end)
   - Number of guests (adults, children, infants)
   - Budget is must
   - Travel preferences (optional: budget, preferred airline, hotel rating)

2. After collecting the trip details, first search for flights using the 'getFlights' function.

3. Present flight options to the user in a structured format as text, exactly like this example:
If either of DepartFlight or ArrivalFlight is missing ask user to select flights and if one is present and one is not call api accordingly 
eg trip is from Kolkata to Japan dn Arrival is Kolkata to Japan airport and Depart is Japan to Kolkata . Call funcs and send params according to that.


DepartFlight - {
    "id": "1",
    "price": "639.60",
    "currency": "USD",
    "from": "CCU",
    "to": "BOM",
    "departure": "2025-11-14T20:30:00",
    "arrival": "2025-11-14T23:20:00",
    "duration": "PT2H50M",
    "airline": "AI",
    "flightNumber": "2776"
} 
ArrivalFlight - {
    "id": "1",
    "price": "639.60",
    "currency": "USD",
    "from": "CCU",
    "to": "BOM",
    "departure": "2025-11-14T20:30:00",
    "arrival": "2025-11-14T23:20:00",
    "duration": "PT2H50M",
    "airline": "AI",
    "flightNumber": "2776"
}

4. Once the user selects their desired flight (one-way or round-trip), then search for hotels using the 'searchHotels' function.

5. Make the conversation engaging, friendly, and helpful. Address the user by name if provided. Provide clear and organized results.

6. Always ensure the user has full context and all selections before suggesting hotels and building itineraries.

7. Avoid giving incomplete recommendations or skipping steps. Never assume missing data.

8. Your tone should be professional yet warm and approachable, making users feel confident about their travel plans.


9. On hotel selection we come like this example json format

 Hotel - {
            "id": "MCBOMSAM",
            "name": "JW Marriott Mumbai Sahar",
            "price": "536074.00",
            "currency": "INR",
            "checkIn": "2025-11-14",
            "checkOut": "2025-11-21"
        }

after getting all this plan a tour package with day wise itinenary according to user needs.

10. Return in full markdown format with emojis and make it pretty.

11. Today is ${
  new Date().toISOString().split("T")[0]
}. Don't take any old dates before today's date.

12. Before calling flight api make sure user has given all datas.

13. After all is done call 'confirmBooking' and send a breakdown of all costs.

14. After switching to any new language persist it untill user asks to change to any other one.

15. Ask user for both departure and arrival flights.

16. If Hotels are not found from tool calling send some data in [
        {
            "id": "CYBOMCYC",
            "name": "Courtyard by Marriott Mumbai International Airport",
            "price": "12390.00",
            "currency": "INR",
            "checkIn": "2025-11-01",
            "checkOut": "2025-11-02"
}] in this format

17. Before confirming booking ask user if he wants to add any special requests like airport transfer , travel insurance etc and add those costs in breakdown.

18.In confirmBooking also include full itinenary in markdown format.

Example flow:
User: "I want to plan a trip."
Roxy: "Great! Can you tell me your departure city, destination, travel dates, and number of guests so I can start planning your perfect trip?"
User: "I'm going to Paris from Delhi, 2 adults and 1 child."
Roxy: "Thanks! What are your travel dates?"
...
After gathering dates:
Roxy: "Here are your flight options (DepartFlight / ArrivalFlight). Please select the flight you prefer."
Once user selects:
Roxy: "Great! Based on your selected flight, here are hotel options and a suggested itinerary."`;

export function createTravelAssistant() {
  const ai = new GoogleGenAI({
    vertexai: true,
    apiKey: config.get("VERTEX_API_KEY"),
  });

  // Store per-session conversation history
  const sessions: Record<
    string,
    {
      history: Array<{
        role: "user" | "model";
        parts: Part[];
      }>;
    }
  > = {};

  function extractText(parts: Part[]): string {
    return parts
      .map((p) => p.text || "")
      .filter(Boolean)
      .join("\n");
  }

  async function handleMessage(
    sessionId: string,
    userMessage: string
  ): Promise<TravelAssistantReply> {
    if (!sessions[sessionId]) {
      sessions[sessionId] = { history: [] };
    }
    const session = sessions[sessionId];

    // Add user message to history
    session.history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const params: GenerateContentParameters = {
      model: "gemini-2.5-pro",
      contents: session.history,
      config: {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        tools: [
          {
            functionDeclarations: [getFlightsFunction, searchHotelsFunction, confirmBooking],
          } as Tool,
        ],
        toolConfig: {} as ToolConfig,
      },
    };

    try {
      const resp: GenerateContentResponse = await ai.models.generateContent(params);

      // If model calls a function
      if (resp.functionCalls && resp.functionCalls.length > 0) {
        const call = resp.functionCalls[0];
        const args = call.args as Record<string, unknown>;
        let functionResult: NormalizedFlight[] | NormalizedHotel[] | null = null;
        const functionName = call.name;

        // getFlights
        if (call.name === "getFlights") {
          const from = args["from"];
          const to = args["to"];
          const departDate = args["departDate"];
          const adults = args["adults"];
          const returnDate = args["returnDate"];
          const children = args["children"];

          if (
            typeof from !== "string" ||
            typeof to !== "string" ||
            typeof departDate !== "string" ||
            typeof adults !== "number"
          ) {
            return {
              reply: "Oops, I got invalid flight search parameters.",
              done: false,
            };
          }

          functionResult = await getFlights({
            from,
            to,
            departDate,
            adults,
            returnDate: typeof returnDate === "string" ? returnDate : undefined,
            children: typeof children === "number" ? children : 0,
          });
        } else if (call.name === "confirmBooking") {
          return {
            reply: (args["bookingBreakDown"] || "Continue to book!") as string,
            done: true,
          };
        }
        // searchHotels
        else if (call.name === "searchHotels") {
          const cityCode = args["cityCode"];
          const checkInDate = args["checkInDate"];
          const checkOutDate = args["checkOutDate"];
          const adults = args["adults"];
          const children = args["children"];

          if (
            typeof cityCode !== "string" ||
            typeof checkInDate !== "string" ||
            typeof checkOutDate !== "string" ||
            typeof adults !== "number"
          ) {
            return {
              reply: "Oops, I got invalid hotel search parameters.",
              done: false,
            };
          }

          functionResult = await searchHotels({
            cityCode,
            checkInDate,
            checkOutDate,
            adults,
            children: typeof children === "number" ? children : 0,
          });
        }

        // Append functionResponse to last model turn
        const lastModelTurn = session.history[session.history.length - 1];
        const functionResponsePart: Part = {
          functionResponse: {
            name: functionName,
            response: { result: functionResult },
          },
        };
        lastModelTurn.parts.push(functionResponsePart);

        // Generate final response with function results
        const followUpResp: GenerateContentResponse = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: session.history,
          config: {
            tools: [
              {
                functionDeclarations: [getFlightsFunction, searchHotelsFunction, confirmBooking],
              } as Tool,
            ],
            toolConfig: {} as ToolConfig,
          },
        });

        const textReply = extractText(followUpResp.candidates?.[0]?.content?.parts || []);
        session.history.push({ role: "model", parts: [{ text: textReply }] });

        return { reply: textReply, data: functionResult, done: false };
      }

      // No function call
      const textReply = extractText(resp.candidates?.[0]?.content?.parts || []);
      session.history.push({ role: "model", parts: [{ text: textReply }] });
      return { reply: textReply, done: false };
    } catch (error) {
      console.error("Error in handleMessage:", error);
      return {
        reply: "Sorry, I encountered an error processing your request. Please try again.",
        done: false,
      };
    }
  }

  return { handleMessage };
}
