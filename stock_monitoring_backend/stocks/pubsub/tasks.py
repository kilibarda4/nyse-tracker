import requests
from google.cloud import firestore, secretmanager
from django.core.mail import send_mail
from django.conf import settings
 # Assuming you have an Alert model to store alerts

db = firestore.Client()
client = secretmanager.SecretManagerServiceClient()


def get_secret(secret_id):
    name = f"projects/{settings.PROJECT_ID}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(name=name)
    return response.payload.data.decode("UTF-8")

# Fetch the API key from Secret Manager
ALPHA_VANTAGE_API_KEY = get_secret("NYSE_API_KEY")
ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query'

# ALPHA_VANTAGE_API_KEY = "V3A80GJOZA9EL6Y4"
# ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"


# Fetch stock prices from an external API
def fetch_stock_price(ticker):
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": ticker,
        "interval": "1min",  # Get data at 1-minute intervals
        "outputsize": "compact",  # Only fetch recent 100 data points
        "datatype": "json",  # JSON output
        "apikey": ALPHA_VANTAGE_API_KEY,
    }
    try:
        response = requests.get(ALPHA_VANTAGE_URL, params=params)
        response.raise_for_status()
        data = response.json()

        # Extract the latest price
        time_series = data.get("Time Series (1min)", {})
        if not time_series:
            print(f"No time series data for ticker {ticker}")
            return None

        # Get the most recent data point
        latest_timestamp = next(iter(time_series))
        latest_data = time_series[latest_timestamp]
        latest_price = latest_data["4. close"]  # Get the closing price
        return float(latest_price)

    except requests.RequestException as e:
        print(f"Error fetching stock price for {ticker}: {e}")
        return None

# Check if the stock price meets any alerts
def check_alerts():
    users_ref = db.collection("users")
    users = users_ref.stream()

    for user in users:
        user_id = user.id
        alerts_ref = db.collection("users").document(user_id).collection("alerts")
        alerts = alerts_ref.stream()

        for alert in alerts:
            alert_data = alert.to_dict()
            ticker = alert_data.get("ticker")
            alert_direction = alert_data.get("priceDirection")
            target_price = float(alert_data.get("targetPrice"))

            latest_price = fetch_stock_price(ticker)
            if latest_price is not None:
                if alert_direction == "decrease":
                    if latest_price <= target_price:
                        send_notification(user_id, ticker, latest_price)
                        print(f"Triggered decrease alert for ${ticker} at {latest_price}")
                elif alert_direction == "increase":
                    if latest_price >= target_price:
                        send_notification(user_id, ticker, latest_price)
                        print(f"Triggered increase alert for ${ticker} at {latest_price}")
                        


                        
# Send notification to the user
def send_notification(user_id, ticker, price):
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        print(f"User document {user_id} does not exist")
        return
    user_data = user_doc.to_dict()
    user_email = user_data.get("email")

    if not user_email:
        print(f"No email found for user {user_id}.")
        return
    
    # Constructing notification email
    subject = f"Stock Alert for {ticker}"
    message = f"The stock price for {ticker} has reached {price}. Check your dashboard for details!"
    try:
        send_mail(
            subject,
            message,
            "nyseTracker@gmail.com",  # Replace with your email
            [user_email],
            fail_silently=False,
        )
        print(f"Notification sent to {user_email} for {ticker}")
    except Exception as e:
        print(f"Failed to send email to {user_email}: {e}")
