const { GoogleGenAI } = require("@google/genai");
const siteMap = require("../data/siteMap");
const sriLankaKnowledge = require("../data/sriLankaKnowledge");

const defaultQuickQuestions = [
  "How can I book a hotel?",
  "Tell me about Sri Lankan culture",
  "What are famous heritage sites?",
  "How can I plan a trip?",
];

const createAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const formatKnowledgeReply = (entry) => {
  const details = entry.examples || entry.tips || entry.etiquette || [];
  const detailText = details.length > 0 ? ` Examples: ${details.slice(0, 5).join(", ")}.` : "";

  return `${entry.content}${detailText}`;
};

const createLocalAssistantResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  const matchedPages = siteMap.filter((page) => {
    const nameMatches = lowerMessage.includes(page.name.toLowerCase());
    const keywordMatches = page.keywords.some((keyword) =>
      lowerMessage.includes(keyword.toLowerCase())
    );

    return nameMatches || keywordMatches;
  });

  let reply =
    "I can help you use TourismHub LK. You can search hotels, explore destinations, plan trips, find events, check transport, view tourist guides, and manage bookings.";
  let externalLinks = [];

  if (lowerMessage.includes("book") || lowerMessage.includes("hotel")) {
    reply =
      "To book a hotel, open the Hotels page, choose a hotel and room, check availability, then complete the booking details. After booking, you can manage it from My Bookings.";
  } else if (lowerMessage.includes("plan") || lowerMessage.includes("trip")) {
    reply =
      "Use the Plan Trip page to build a day-by-day itinerary. You can combine destinations, hotels, transport, events, and tourist guides for your Sri Lanka journey.";
  } else if (lowerMessage.includes("culture")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.culture);
    externalLinks = sriLankaKnowledge.culture.links || [];
  } else if (lowerMessage.includes("heritage") || lowerMessage.includes("famous site")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.heritageSites);
    externalLinks = sriLankaKnowledge.heritageSites.links || [];
  } else if (lowerMessage.includes("history")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.history);
    externalLinks = sriLankaKnowledge.history.links || [];
  } else if (lowerMessage.includes("religion") || lowerMessage.includes("temple")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.religions);
  } else if (lowerMessage.includes("food")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.food);
  } else if (lowerMessage.includes("festival") || lowerMessage.includes("event")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.festivals);
  } else if (
    lowerMessage.includes("wildlife") ||
    lowerMessage.includes("nature") ||
    lowerMessage.includes("beach")
  ) {
    reply = formatKnowledgeReply(sriLankaKnowledge.natureAndWildlife);
    externalLinks = sriLankaKnowledge.natureAndWildlife.links || [];
  } else if (lowerMessage.includes("safety") || lowerMessage.includes("emergency")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.emergencyAndSafety);
  } else if (lowerMessage.includes("etiquette") || lowerMessage.includes("respect")) {
    reply = formatKnowledgeReply(sriLankaKnowledge.travelEtiquette);
  } else if (
    lowerMessage.includes("sri lanka") ||
    lowerMessage.includes("tourism") ||
    lowerMessage.includes("travel")
  ) {
    reply = sriLankaKnowledge.overview.content;
    externalLinks = sriLankaKnowledge.overview.links || [];
  }

  const suggestedActions =
    matchedPages.length > 0
      ? matchedPages.slice(0, 3).map((page) => ({
          label: `Go to ${page.name}`,
          path: page.path,
        }))
      : [
          {
            label: "Go to Hotels",
            path: "/hotels",
          },
          {
            label: "Plan a Trip",
            path: "/trip-planner",
          },
          {
            label: "Explore Sri Lanka",
            path: "/explore",
          },
        ];

  return {
    success: true,
    reply,
    suggestedActions,
    quickQuestions: defaultQuickQuestions,
    externalLinks,
  };
};

const askAssistant = async (req, res) => {
  try {
    const { message, currentPage, userRole } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        reply: "Please enter a message.",
        suggestedActions: [],
        quickQuestions: defaultQuickQuestions,
        externalLinks: [],
      });
    }

    const localResponse = createLocalAssistantResponse(message);
    const ai = createAiClient();

    if (!ai) {
      return res.json(localResponse);
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
        quickQuestions: defaultQuickQuestions,
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

    const message = req.body?.message || "";

    return res.json(createLocalAssistantResponse(message));
  }
};

module.exports = {
  askAssistant,
};
