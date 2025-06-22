import sys
import json
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import yfinance as yf
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

symbol = sys.argv[1]
model = load_model(f'models/{symbol}_lstm.h5')  # Pretrained model per symbol

a
data = yf.download(symbol, period='6mo')
close_prices = data['Close'].values.reshape(-1, 1)


scaler = MinMaxScaler()
scaled = scaler.fit_transform(close_prices)

X_test = []
days = 60
for i in range(days, len(scaled)):
    X_test.append(scaled[i - days:i, 0])

X_test = np.array(X_test)
X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 1))

last_sequence = X_test[-1].reshape(1, 60, 1)
predicted_price = model.predict(last_sequence)[0][0]
current_price = scaled[-1][0]

trend = 'rise' if predicted_price > current_price else 'fall'
confidence = abs(predicted_price - current_price)

print(json.dumps({
    "prediction": trend,
    "confidence": round(float(confidence), 2)
}))
