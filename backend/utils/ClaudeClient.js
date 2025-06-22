
const axios = require('axios');

class ClaudeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async ask(prompt, model = 'claude-3-haiku-20240307') {
    const systemPrompt =
      "You are FinBot, a highly qualified intelligent financial assistant. You are able to answer any question. " +
      "Do not use hashtags or markdown headers. Use plain section titles like 'Strengths:' or 'Recommendation:' and format content as readable bullet points and paragraphs,Never say:I don't have enough information about your individual financial situation. Always respond in a structured, markdown format using the following 4 sections. Write a very very short paragraph, maintain space.:\n\n" +
      "Strengths\n" +
      "- Include two categories: Profitability and Liquidity.\n" +
      "- Use bullet points with the metric name, value, and a short explanation (1 line each).\n" +
      "- Add a score out of 10 if applicable (e.g. ROA: 22.8% — Score: 9/10).\n\n" +
      "Weaknesses\n" +
      "- List any relevant financial weaknesses in 1–2 short bullet points.\n" +
      "- If none exist, clearly state 'None identified.'\n\n" +
      "Financial Health Summary\n" +
      "- Summarize in 2–3 concise sentences with no repetition from above.\n" +
      "- Highlight efficiency, stability, or growth potential.\n\n" +
      "FinBot Recommendation\n" +
      "- Provide a direct yes/no style investment outlook in 2–3 sentences.\n" +
      "- Mention if the company is a strong long-term pick or suitable for stable portfolios.\n\n" +
      "Keep the tone professional, confident, and helpful. Avoid long paragraphs. Be concise and easy to scan.";

    try {
      const res = await axios.post(
        this.baseURL,
        {
          model,
          max_tokens: 800,
          temperature: 0.5,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );
      return res.data?.content?.[0]?.text || '[No response from Claude]';
    } catch (err) {
      console.error('Claude error:', err.response?.data || err.message);
      return '[Claude API error]';
    }
  }
}

module.exports = ClaudeClient;
