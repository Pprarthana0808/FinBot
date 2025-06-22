const axios = require('axios');

async function summarizeFinancialContent(text) {
  const prompt = `
You are a financial parser. Given the following PDF content, extract structured information.

Return a JSON object with:
{
  type: "401k" | "bank" | "unknown",
  provider: string,
  accountNumber?: string,
  balance?: string,
  employeeContributions?: string,
  employerContributions?: string,
  endingValue?: string,
  allocation?: {
    Stocks: number,
    Bonds: number,
    Cash: number
  },
  transactions?: string[]
}

Content:
${text}
`;

  const res = await axios.post('http://localhost:11434/api/generate', {
    model: 'mistral',
    prompt,
    stream: false
  });

  const outputText = res.data.response;

  try {
    const jsonStart = outputText.indexOf('{');
    const jsonEnd = outputText.lastIndexOf('}');
    const cleanJson = outputText.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("❌ Failed to parse LLM output:", outputText);
    return { type: 'unknown', error: 'LLM failed to extract fields' };
  }
}

module.exports = summarizeFinancialContent;
