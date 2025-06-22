const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Sentiment = require('sentiment');
const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const PDFParser = require('pdf2json');
const summarizeFinancialContent = require('./summarize_llm');
const analysisRoutes = require('./routes/analysis');

require('dotenv').config();
console.log('🔐 CLAUDE_API_KEY loaded:', process.env.CLAUDE_API_KEY ? '✅ yes' : '❌ no');

const app = express();
app.use(cors());
app.use(express.json());
app.use(analysisRoutes); 

const sentiment = new Sentiment();
const API_KEY = process.env.TWELVE_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const HISTORY_FILE = 'history.json';
let history = fs.existsSync(HISTORY_FILE)
  ? JSON.parse(fs.readFileSync(HISTORY_FILE))
  : [];

const upload = multer({ dest: 'uploads/' });

app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const pdfParser = new PDFParser();
  pdfParser.on("pdfParser_dataError", errData =>
    res.status(500).json({ error: errData.parserError })
  );

  pdfParser.on("pdfParser_dataReady", async pdfData => {
    const rawText = [];
    pdfData?.formImage?.Pages.forEach((page) => {
      const pageText = page.Texts.map(textObj => {
        const text = decodeURIComponent(textObj.R[0].T);
        return text;
      }).join(' ');
      rawText.push(pageText);
    });
    const content = rawText.join('\n');

    try {
      const summary = await summarizeFinancialContent(content);
      summary.contentSnippet = content.slice(0, 1000) + '...';
      res.json(summary);
    } catch (error) {
      console.error('❌ LLM summarization error:', error.message);
      res.status(500).json({ error: 'LLM summarization failed' });
    }
  });

  pdfParser.loadPDF(req.file.path);
});

app.post('/api/store-summary', (req, res) => {
  const { name, summary } = req.body;
  if (name && summary) {
    history.push({ name, summary });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    res.json({ status: 'stored' });
  } else {
    res.status(400).json({ error: 'Missing name or summary' });
  }
});

app.get('/api/get-history', (req, res) => {
  res.json(history);
});

app.delete('/api/clear-history', (req, res) => {
  history = [];
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
  res.json({ status: 'cleared' });
});

app.get('/api/stock', async (req, res) => {
  let symbol = req.query.symbol?.toUpperCase();
  if (!symbol || !/^[A-Z.]+$/.test(symbol)) symbol = 'AAPL';

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${API_KEY}`;
    const response = await axios.get(url);
    if (!response.data || !response.data.values) return res.status(502).json({ error: 'Invalid data from Twelve Data' });

    const series = response.data.values;
    const dates = series.map(entry => entry.datetime).reverse();
    const prices = series.map(entry => parseFloat(entry.close)).reverse();
    res.json({ dates, prices });
  } catch (err) {
    console.error('❌ Stock API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.get('/api/sentiment', async (req, res) => {
  const { symbol = 'AAPL' } = req.query;
  if (!NEWS_API_KEY) return res.status(500).json({ error: 'Missing NEWS_API_KEY in .env' });

  try {
    const news = await axios.get(`https://newsapi.org/v2/everything?q=${symbol}&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`);
    const articles = news.data.articles || [];
    const scores = { positive: 0, negative: 0, neutral: 0, total: 0 };

    articles.forEach(article => {
      const text = `${article.title} ${article.description || ''}`;
      const result = sentiment.analyze(text);
      if (result.score > 0) scores.positive++;
      else if (result.score < 0) scores.negative++;
      else scores.neutral++;
      scores.total += result.score;
    });

    const overall = scores.total / (scores.positive + scores.negative + scores.neutral || 1);
    res.json({ score: Number(overall.toFixed(2)), ...scores });
  } catch (err) {
    console.error('❌ Sentiment API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sentiment data' });
  }
});

app.get('/api/predict', async (req, res) => {
    const { symbol = 'AAPL' } = req.query;
    const scriptPath = path.join(__dirname, 'fetch_price_prediction.py');
  
    const py = spawn('python3', [scriptPath, symbol]);
    let data = '', error = '';
  
    py.stdout.on('data', chunk => {
      const text = chunk.toString();
      console.log('📈 Python stdout:', text);
      data += text;
    });
  
    py.stderr.on('data', chunk => { error += chunk.toString(); });
  
    py.on('close', code => {
      if (error) console.error('❌ Python error:', error);
      if (code !== 0) return res.status(500).json({ error: 'Python script failed' });
  
      try {
        const match = data.trim().match(/\[.*\]|\{.*\}/s);
        if (!match) throw new Error('No valid JSON found in Python output');
  
        const output = JSON.parse(match[0]);
        res.json(output);
      } catch (err) {
        console.error('❌ JSON parse error:', err.message);
        res.status(500).json({ error: 'Invalid JSON from Python' });
      }
    });
  });
  
app.post('/api/ask', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });
    if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Missing CLAUDE_API_KEY in .env' });
  
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          temperature: 0.7,
          system: "You are FinBot, a friendly and very intelligent financial assistant. Always briefly answer the questions in 2-3 sentences, even if you have to make recommendations. Never say I'm afraid I can't recommend specific stocks for you to invest in. As a financial assistant, I don't have enough information about your individual financial situation, goals, risk tolerance, and investment timeline to provide personalized stock picks. Provide short,clear, responsible, and helpful answers, but feel free to mention example stocks or investing principles.",
          messages: [
            { role: 'user', content: question }
          ]
        })
      });
  
      const result = await response.json();
  
      if (!result || !result.content || !Array.isArray(result.content)) {
        console.error('⚠️ Invalid Claude response:', result);
        return res.status(502).json({ reply: '❌ Claude returned an invalid response.' });
      }
  
      const reply = result.content.map(part => part.text).join('\n');
      return res.json({ reply });
  
    } catch (error) {
      console.error('❌ Claude API error:', error.message);
      return res.status(500).json({ error: 'Claude AI request failed' });
    }
  });
  
  app.get('/api/stock-trend', async (req, res) => {
    const { symbol = 'AAPL' } = req.query;
    const scriptPath = path.join(__dirname, 'fetch_trend_forecast.py');
  
    const py = spawn('python3', [scriptPath, symbol]);
    let data = '', error = '';
  
    py.stdout.on('data', chunk => { data += chunk.toString(); });
    py.stderr.on('data', chunk => { error += chunk.toString(); });
  
    py.on('close', code => {
      if (error) console.error('❌ Trend Python error:', error);
      if (code !== 0) return res.status(500).json({ error: 'Trend script failed' });
  
      try {
        const match = data.trim().match(/\{.*\}/s); // extract first JSON object
        const output = JSON.parse(match[0]);
        res.json(output);
      } catch (err) {
        console.error('❌ Trend JSON error:', err.message);
        res.status(500).json({ error: 'Invalid trend JSON from Python' });
      }
    });
  });
  
app.listen(5001, () => {
  console.log('✅ Backend running at http://localhost:5001');
});
