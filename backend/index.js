const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const PORT = 5001;

app.use(cors());

app.get('/api/stocks', async (req, res) => {
  const symbols = req.query.symbols?.split(',') || ['AAPL', 'TSLA', 'AMZN'];

  try {
    const results = await Promise.all(
      symbols.map((symbol) => yahooFinance.quote(symbol))
    );

    res.json(results.map(({ symbol, regularMarketPrice, shortName }) => ({
      symbol,
      name: shortName,
      price: regularMarketPrice
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.listen(PORT, () => {
  console.log(`FinBot backend running at http://localhost:${PORT}`);
});
