import axios from "axios";
import { tool, type JSONValue } from "@strands-agents/sdk";
import { z } from "zod";

const getForecast = async (input: {
    lat: number;
    lon: number;
}): Promise<JSONValue> => {
    const { lat, lon } = input;
    const params = {
        'latitude': lat,
        'longitude': lon,
        'current_weather': 'true',
        'hourly': ['relativehumidity_2m','precipitation_probability','weathercode','temperature_80m'],
        'forcast_days': 7,
    }
    const response = await axios.get(
        'https://api.open-meteo.com/v1/forecast', {
            params
        }
    )

    return response.data as unknown as JSONValue;
}

export const getForecastTool = tool({
    name: "getForecast",
    description: "Get weather forecast for a week",
    inputSchema: z.object({
        lat: z.number(),
        lon: z.number()
    }),
    callback: getForecast
})