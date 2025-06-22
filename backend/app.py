from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

def get_price_data(ticker):
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")

        if hist.empty:
            return {"error": f"No historical data found for '{ticker}'."}

        info = stock.info
        if not info or "regularMarketPrice" not in info:
            return {"error": f"Ticker '{ticker}' may be invalid or missing market data."}

        close_prices = hist['Close'].round(2).tolist()
        labels = hist.index.strftime('%b %d').tolist()

        return {
            "prices": close_prices,
            "labels": labels,
            "recommendation": info.get("recommendationKey", "HOLD").upper(),
            "targetPrice": round(info.get("targetMeanPrice", 0), 2),
            "confidence": 73,
            "currentPrice": round(info.get("regularMarketPrice", 0), 2),
            "change": round(info.get("regularMarketChange", 0), 2),
            "high": round(info.get("fiftyTwoWeekHigh", 0), 2),
            "low": round(info.get("fiftyTwoWeekLow", 0), 2),
            "volume": info.get("volume", 0)
        }

    except Exception as e:
        return {"error": f"Backend error for '{ticker}': {str(e)}"}



def get_sentiment_data(ticker):
    # Simulate sentiment score
    return {
        "overallScore": 0.65,
        "twitter": { "bullish": 70, "bearish": 30 },
        "reddit": { "bullish": 60, "bearish": 40 }
    }

-
def get_prediction_data(ticker):
    return {
        "currentPrice": 150,
        "predictedPrice": 165,
        "confidence": 82,
        "forecast": [150, 152, 155, 158, 162, 164, 165],
        "features": { "momentum": 40, "volume": 20, "RSI": 25, "news": 15 },
        "metrics": { "mae": 1.8, "r2": 0.89, "directionalAccuracy": 80 }
    }


def get_options_strategy(ticker):
    return {
        "strategy": "Covered Call",
        "strikePrice": 155,
        "premium": 2.5,
        "returnPotential": 4.5,
        "riskLevel": "Moderate",
        "impliedVolatility": 22.3,
        "expiry": "2025-07-19",
        "pros": [
            "Generates premium income",
            "Reduces break-even cost",
            "Simple and conservative strategy"
        ],
        "cons": [
            "Limits upside potential",
            "Requires holding underlying shares",
            "May require margin account"
        ]
    }


@app.route('/api/stock/<ticker>/price')
def price_route(ticker):
    print(f"📡 Fetching price data for {ticker}")
    return jsonify(get_price_data(ticker.upper()))

@app.route('/api/stock/<ticker>/sentiment')
def sentiment_route(ticker):
    return jsonify(get_sentiment_data(ticker.upper()))

@app.route('/api/stock/<ticker>/prediction')
def prediction_route(ticker):
    return jsonify(get_prediction_data(ticker.upper()))

@app.route('/api/stock/<ticker>/options')
def options_route(ticker):
    return jsonify(get_options_strategy(ticker.upper()))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
