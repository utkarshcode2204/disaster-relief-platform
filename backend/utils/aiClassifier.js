const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const classifyRequest = async (description) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are helping triage disaster relief requests. Given the description below, respond ONLY with a valid JSON object (no markdown, no explanation, no code fences) in this exact format:
{
  "category": "medical" | "food" | "shelter" | "rescue",
  "urgencyScore": <number 1-5, 5 being most urgent>,
  "peopleAffected": <number or null if not mentioned>,
  "tags": [<short keyword strings describing the situation>]
}

Description: "${description}"`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Gemini sometimes wraps JSON in markdown code fences - strip them if present
    responseText = responseText.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (err) {
    console.error('AI classification failed:', err.message);
    return {
      category: 'medical',
      urgencyScore: 0,
      peopleAffected: null,
      tags: [],
    };
  }
};

module.exports = classifyRequest;