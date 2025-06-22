module.exports = {
    profitabilityAgent: async (ticker, claudeClient) => {
      const prompt = `You are a profitability analyst. Analyze ${ticker}'s Return on Assets, Return on Equity, Net Profit Margin, and Gross Margin.
  Score each from 1 to 10 based on these healthy thresholds:
  - ROA > 5%
  - ROE > 15%
  - NPM > 10%
  - GM > 40%
  Give explanations and an overall comment.`;
      return await claudeClient.ask(prompt);
    },
  
    liquidityAgent: async (ticker, claudeClient) => {
      const prompt = `You are a liquidity analyst. Review ${ticker}'s Current Ratio, Quick Ratio, Debt-to-Equity Ratio, and Interest Coverage Ratio.
  Score each from 1 to 10 using these benchmarks:
  - CR 1.5–3.0
  - QR > 1.0
  - D/E between 0.3–1.5
  - ICR > 3.0
  Explain results and summarize liquidity health.`;
      return await claudeClient.ask(prompt);
    },
  
    supervisorAgent: async (profitReply, liquidReply, claudeClient) => {
      const prompt = `You're a supervisor agent. Combine the following profitability and liquidity assessments into one full analysis with recommendation:
  
  --- Profitability ---
  ${profitReply}
  
  --- Liquidity ---
  ${liquidReply}
  
  Highlight strengths, weaknesses, and give a financial health summary.`;
      return await claudeClient.ask(prompt);
    }
  };
  