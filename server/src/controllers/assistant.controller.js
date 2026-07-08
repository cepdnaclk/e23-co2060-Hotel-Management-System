const { GoogleGenAI } = require("@google/genai");
const siteMap = require("../data/siteMap");

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
      });
    }

    const prompt = `
You are the AI assistant for TourismHub LK.

TourismHub LK is a Sri Lankan travel and tourism web platform.
It helps users explore destinations, book hotels, find events, find transport, plan trips, and find tourist guides.

Your main job:
1. Help users find the correct page or tab in the website.
2. Suggest useful website features.
3. Give short, friendly, and clear answers.
4. If a relevant page exists, include it in suggestedActions.
5. Do not pretend to complete hotel bookings, payments, cancellations, or admin approvals.
6. If the user asks for real-time availability, tell them to check the relevant page.
7. Reply only as valid JSON. Do not include markdown. Do not include backticks.

Website pages:
${JSON.stringify(siteMap, null, 2)}

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
    "How can I plan a trip?"
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
          "I can help you find hotels, events, destinations, transport, guides, and trip planning options.",
        suggestedActions: [],
        quickQuestions: [
          "How can I book a hotel?",
          "How can I plan a trip?",
          "How can I find events?",
        ],
      };
    }

    return res.json({
      success: true,
      ...parsedResponse,
    });
  } catch (error) {
    console.error("Gemini Assistant Error:", error);

    return res.status(500).json({
      success: false,
      reply: "Sorry, the AI assistant is not available right now.",
      suggestedActions: [],
      quickQuestions: [],
    });
  }
};

module.exports = {
  askAssistant,
};