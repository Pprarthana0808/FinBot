
const express = require('express');
const router = express.Router();
const ClaudeClient = require('../utils/ClaudeClient');
const agents = require('../agents/claude_agents');

router.post('/api/agent-analysis', async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ reply: 'Ticker is required.' });

  const claude = new ClaudeClient(process.env.CLAUDE_API_KEY);

  try {
    const profitReply = await agents.profitabilityAgent(ticker, claude);
    const liquidReply = await agents.liquidityAgent(ticker, claude);
    const finalReply = await agents.supervisorAgent(profitReply, liquidReply, claude);
    res.json({ reply: finalReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: 'Agent analysis failed.' });
  }
});

module.exports = router;
