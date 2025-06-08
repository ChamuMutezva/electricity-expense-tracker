import { chatAboutElectricity } from "@/actions/ai-analysis-actions"

export async function POST(req: Request) {
  try {
    console.log("Chat API called")

    // Check if Google Gemini API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY not configured")
      return new Response(JSON.stringify({ error: "Google Gemini API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = await req.json()
    console.log("Request body:", body)

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

    console.log("User message:", userMessage)

    // Get conversation history (excluding the latest message)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationHistory = messages.slice(0, -1).map((msg: any) => `${msg.role}: ${msg.content}`)

    // Stream the AI response
    const response = await chatAboutElectricity(userMessage, conversationHistory)
    console.log("AI response generated successfully")

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