const axios = require('axios');

const classifyRequest = async (description) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `You are helping triage disaster relief requests. Given the description below, respond ONLY with a valid JSON object (no markdown, no explanation, no code fences) in this exact format:
{
  "category": "medical" | "food" | "shelter" | "rescue",
  "urgencyScore": <number 1-5, 5 being most urgent>,
  "peopleAffected": <number or null if not mentioned>,
  "tags": [<short keyword strings describing the situation>]
}

Description: "${description}"`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let responseText = response.data.choices[0].message.content.trim();
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