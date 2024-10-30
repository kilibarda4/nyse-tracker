from django.shortcuts import render

# Create your views here.
import requests

from django.http import JsonResponse

ALPHA_VANTAGE_API_KEY = 'V3A80GJOZA9EL6Y4' #dont lose
#V3A80GJOZA9EL6Y4
#CLJJA7CIAGDUVHOH used up key

ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query'

def get_stock_data(request):
    symbols = request.GET.getlist('symbols[]',[]) # default to AAPL if no symbol is provided
    interval = '60min'
    stock_prices = {}
    for symbol in symbols:
        params = {
            'function': 'TIME_SERIES_INTRADAY',
            'interval': interval,
            'symbol': symbol,
            'apikey':ALPHA_VANTAGE_API_KEY
        }
        response = requests.get(ALPHA_VANTAGE_URL,params=params)
        data = response.json()
        print(data)
        print("hey")
        

        if 'Time Series (60min)' in data:
            time_series = data['Time Series (60min)']
            latest_date = next(iter(time_series))
            latest_data = time_series[latest_date]
            print(latest_data)
            stock_prices[symbol] = latest_data['4. close']  #store the close price
        else:
            stock_prices[symbol] = "N/A" #missing data for price
    print(stock_prices)
    
    return JsonResponse(stock_prices)
    


