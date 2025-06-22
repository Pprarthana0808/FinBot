import sys
import json
from datetime import datetime, timedelta

def predict(symbol):
    base_prices = {
        "AAPL": 150.00,
        "AMZN": 125.00,
        "TSLA": 220.00,
        "GOOGL": 135.00
    }

    base = base_prices.get(symbol.upper(), 100.00)
    prediction = []

    for i in range(7):
        date = (datetime.today() + timedelta(days=i)).strftime('%Y-%m-%d')
        mean = round(base * (1 + 0.01 * (i + 1)), 2)
        upper = round(mean * 1.02, 2)
        lower = round(mean * 0.98, 2)
        prediction.append({
            "date": date,
            "mean": mean,
            "upper": upper,
            "lower": lower
        })

    return prediction

if __name__ == "__main__":
    input_symbol = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    result = predict(input_symbol)
    json.dump(result, sys.stdout)  
