const { GoogleGenAI } = require("@google/genai");
const siteMap = require("../data/siteMap");
const sriLankaKnowledge = require("../data/sriLankaKnowledge");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const askAssistant = async (req, res) => {
  try {
    const { message, currentPage, userRole } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        reply: "Please enter a message.",
        suggestedActions: [],
        quickQuestions: [],
        externalLinks: [],
      });
    }

    const prompt = `
You are the AI assistant for TourismHub LK.

TourismHub LK is a Sri Lankan travel and tourism web platform.
It helps users explore destinations, book hotels, find events, find transport, plan trips, find tourist guides, and learn about Sri Lanka.

Your main duties:
1. Help users find the correct page or tab in TourismHub LK.
2. Explain Sri Lankan history, culture, religions, food, festivals, etiquette, wildlife, heritage, and travel tips.
3. Suggest useful TourismHub LK pages.
4. If useful, provide trusted external links from the trustedExternalSources list only.
5. Do not pretend to complete hotel bookings, payments, cancellations, partner registrations, or admin approvals.
6. If the user asks for real-time information such as weather, train times, current availability, or live prices, tell them to check the relevant official source or TourismHub page.
7. Reply only as valid JSON. Do not include markdown. Do not include backticks.

Website pages:
${JSON.stringify(siteMap, null, 2)}

Sri Lanka tourism knowledge:
${JSON.stringify(sriLankaKnowledge, null, 2)}

Current page: ${currentPage || "unknown"}
User role: ${userRole || "guest"}

User message:
${message}

Return only this JSON format:
{
  "reply": "short helpful answer",
  "suggestedActions": [
    {
      "label": "Go to Hotels",
      "path": "/hotels"
    }
  ],
  "quickQuestions": [
    "How can I book a hotel?",
    "Tell me about Sri Lankan culture",
    "What are famous heritage sites?",
    "How can I plan a trip?"
  ],
  "externalLinks": [
    {
      "label": "Official Sri Lanka Tourism Website",
      "url": "https://www.srilanka.travel/"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
    });

    let outputText = response.text || "";

    outputText = outputText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(outputText);
    } catch (error) {
      parsedResponse = {
        reply:
          outputText ||
          "I can help you find hotels, events, destinations, transport, guides, trip planning options, and Sri Lanka tourism information.",
        suggestedActions: [],
        quickQuestions: [
          "How can I book a hotel?",
          "Tell me about Sri Lankan culture",
          "What are famous heritage sites?",
          "How can I plan a trip?",
        ],
        externalLinks: [],
      };
    }

    return res.json({
      success: true,
      reply:
        parsedResponse.reply ||
        "I can help you use TourismHub LK and learn about Sri Lanka.",
      suggestedActions: parsedResponse.suggestedActions || [],
      quickQuestions: parsedResponse.quickQuestions || [],
      externalLinks: parsedResponse.externalLinks || [],
    });
  } catch (error) {
    console.error("Gemini Assistant Error:", error);

    return res.status(500).json({
      success: false,
      reply: "Sorry, the AI assistant is not available right now.",
      suggestedActions: [],
      quickQuestions: [],
      externalLinks: [],
    });
  }
};

module.exports = {
  askAssistant,
};
