from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse

from django.http import JsonResponse
from django.contrib.auth.models import User
from stocks.pubsub.publisher import publish_message
from stocks.pubsub.tasks import check_alerts

from django.views.decorators.csrf import csrf_exempt
import json
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


def send_verification_email(request):
    if request.method == "POST":
        user = request.user
        if user.is_authenticated:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            verification_link = request.build_absolute_uri(
                reverse("verify_email", kwargs={"uid64": uid, "token":token})
            )
            send_mail(
                subject="Verify Your Email Address",
                message=f"Click the link to verify your email: {verification_link}",
                from_email = "nyseTracker@gmail.com",
                recipient_list=[user.email],
                fail_silently = False,
            )
            return JsonResponse({"message": "Verification email sent!"})
        else:
            return JsonResponse({"error": "User not authenticated"}, status=401)

    return JsonResponse({"error": "Invalid request method"}, status=400)


# Verify email
def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = get_object_or_404(User, pk=uid)
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return JsonResponse({"message": "Email verified successfully!"})
        else:
            return JsonResponse({"error": "Invalid or expired token"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
    


def register_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)  # Parse JSON data from request
            username = data.get("username")
            email = data.get("email")
            password = data.get("password")

            if not username or not email or not password:
                return JsonResponse({"error": "All fields are required!"}, status=400)

            if User.objects.filter(username=username).exists():
                return JsonResponse({"error": "Username already exists!"}, status=400)

            if User.objects.filter(email=email).exists():
                return JsonResponse({"error": "Email already exists!"}, status=400)

            # Create the user with is_active set to False
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=False
            )
            user.save()

            # Trigger email verification
            request.user = user  # Pass the new user to the send_verification_email function
            return send_verification_email(request)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method!"}, status=400)

@csrf_exempt
def publish_stock_alert(request):
    if request.method == "POST":
        try:
            body = json.loads(request.body)
            message_data = body.get("message_data")
            if not message_data:
                return JsonResponse({"error": "Message data is required"}, status=400)

            publish_message(message_data)
            return JsonResponse({"success": True, "message": "Message published successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)

def trigger_alert_check(request):
    if request.method == "POST":
        try:
            check_alerts()
            return JsonResponse({"message": "Alerts checked successfully"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)

def check_all_alerts(request):
    if request.method == "POST":  # Ensure it's a POST request for security
        try:
            check_alerts()
            return JsonResponse({"success": True, "message": "All alerts checked successfully."})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method."}, status=405)