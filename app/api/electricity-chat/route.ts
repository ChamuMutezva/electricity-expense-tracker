/**
 * Handles POST requests to the electricity chat API endpoint.
 *
 * This endpoint receives a list of chat messages, validates the input,
 * and generates a response using the Google Gemini API via the `chatAboutElectricity` action.
 * It expects the request body to contain a `messages` array, where each message has a `role` and `content`.
 * The latest user message is used as the prompt, and previous messages are used as conversation history.
 *
 * @param req - The incoming HTTP request object.
 * @returns A `Response` object containing the AI-generated reply or an error message.
 *
 * @throws {Error} Returns a 500 response if the Google Gemini API key is not configured,
 *                 if the request body is invalid, or if an unexpected error occurs.
 *
 * @example
 * // Request body format:
 * {
 *   "messages": [
 *     { "role": "user", "content": "How can I save electricity?" },
 *     { "role": "assistant", "content": "You can start by..." },
 *     { "role": "user", "content": "What about using LED bulbs?" }
 *   ]
 * }
 */
import { chatAboutElectricity } from "@/actions/ai-analysis-actions"

export async function POST(req: Request) {
  try {
    
    // Check if Google Gemini API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY not configured")
      return new Response(JSON.stringify({ error: "Google Gemini API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = await req.json()
    
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || ""

    if (!userMessage.trim()) {
      return new Response(JSON.stringify({ error: "Empty message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    // Get conversation history (excluding the latest message)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationHistory = messages.slice(0, -1).map((msg: any) => `${msg.role}: ${msg.content}`)

    // Stream the AI response
    const response = await chatAboutElectricity(userMessage, conversationHistory)
    
    return response
  } catch (error) {
    console.error("Chat API error:", error)

    // Return a proper error response
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}