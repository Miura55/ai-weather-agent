import axios from "axios";
import { tool, type JSONValue } from "@strands-agents/sdk";
import { z } from "zod";

const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
if (!apiKey) {
  throw new Error("OpenWeather API key is not configured. Please set NEXT_PUBLIC_OPENWEATHER_API_KEY in .env.local");
}

const getCurrentWeather = async (input: {
  lat: number;
  lon: number;
}): Promise<JSONValue> => {
  const { lat, lon } = input;
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
  );
  return response.data as unknown as JSONValue;
};

export const getCurrentWeatherTool = tool({
  name: "getCurrentWeather",
  description: "Get the current weather for a given latitude and longitude",
  inputSchema: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  callback: getCurrentWeather,
});
