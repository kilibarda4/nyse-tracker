from django.shortcuts import render

# Create your views here.
import requests

from django.http import JsonResponse

ALPHA_VANTAGE_API_KEY = 'CLJJA7CIAGDUVHOH' #dont lose

ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query'

def get_stock_data(request):
    symbol = request.GET.get('symbol','AAPL') # default to AAPL if no symbol is provided
    interval = request.GET.get('interval', '60min')
    params = {
        'function': 'TIME_SERIES_INTRADAY',
        'interval': '60min',
        'symbol': symbol,
        'apikey':ALPHA_VANTAGE_API_KEY
    }
    response = requests.get(ALPHA_VANTAGE_URL,params=params)
    data = response.json()
    print(data)

    if 'Time Series ('+interval+')' in data:
        time_series = data['Time Series ('+interval+')']
        latest_date = next(iter(time_series))
        latest_data = time_series[latest_date]

        return JsonResponse({
            'symbol': symbol,
            'data': latest_date,
            'interval': interval,
            'open': latest_data['1. open'],
            'high': latest_data['2. high'],
            'low': latest_data['3. low'],
            'close': latest_data['4. close'],
            'volume': latest_data['5. volume']
        })
    else:
        return JsonResponse({'error': 'Failed to retrieve data'}, status=400)    


