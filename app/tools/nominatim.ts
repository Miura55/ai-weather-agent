import axios from "axios";
import { tool, type JSONValue } from "@strands-agents/sdk";
import { z } from "zod";


const getLocation = async (input: { query: string }): Promise<JSONValue> => {
    const { query } = input;
    const response = await axios.get<JSONValue>(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );
    return response.data;
};

export const getLocationTool = tool({
    name: "getLocation",
    description: "Get the location for a given query",
    inputSchema: z.object({
        query: z.string(),
    }),
    callback: getLocation,
});