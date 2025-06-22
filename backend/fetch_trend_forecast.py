import sys
import json
import random

def forecast(symbol):
    outcome = random.choices(
        ["rise", "crash", "neutral"],
        weights=[0.5, 0.2, 0.3],
        k=1
    )[0]

    confidence = {
        "rise": round(random.uniform(60, 85), 1),
        "crash": round(random.uniform(50, 75), 1),
        "neutral": round(random.uniform(40, 60), 1)
    }[outcome]

    return {
        "symbol": symbol.upper(),
        "trend": outcome,
        "confidence": confidence
    }

if __name__ == "__main__":
    symbol = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    result = forecast(symbol)
    print(json.dumps(result), flush=True)
