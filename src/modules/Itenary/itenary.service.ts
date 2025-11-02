import {
  GoogleGenAI,
  type GenerateContentParameters,
  GenerateContentResponse,
  type Tool,
  type ToolConfig,
  type Part,
} from "@google/genai";
import { getFlights } from "../Flight/flight.service.js";
import { searchHotels } from "../Hotel/hotel.service.js";
import { config } from "../../utils/config.js";
import { NormalizedFlight } from "../Flight/flight.schema.js";
import { NormalizedHotel } from "../Hotel/hotel.schema.js";
import {
  type TravelAssistantReply,
  getFlightsFunction,
  confirmBooking,
  searchHotelsFunction,
  SYSTEM_PROMPT,
} from "./itenary.schema.js";
import { logger } from "../../utils/logger.js";

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
            return{
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
              reply: "Oops, I encountered an error searching for hotels. Please try again.",
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
      logger.error({
        message: "Error in handleMessage",
        module: "ItenaryService",
        data: error,
      });
      return {
        reply: "Sorry, I encountered an error processing your request. Please try again.",
        done: false,
      };
    }
  }

  return { handleMessage };
}
