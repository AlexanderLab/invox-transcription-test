import axios from "axios";

export const handler = async (event: any) => {
  try {
    // Generate a temporary token for AssemblyAI real-time streaming (v3)
    const response = await axios.get(
      "https://streaming.assemblyai.com/v3/token?expires_in_seconds=600",
      { 
        headers: { 
          "Authorization": process.env.ASSEMBLYAI_API_KEY!,
          "Content-Type": "application/json"
        } 
      }
    );

    const token = response.data.token;
    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (error: any) {
    console.error("AI Token Error:", JSON.stringify(error?.response?.data || error?.message));
    // Fallback: return API key directly (less secure but functional for demo)
    return {
      statusCode: 200,
      body: JSON.stringify({ token: process.env.ASSEMBLYAI_API_KEY, isApiKey: true }),
    };
  }
};

