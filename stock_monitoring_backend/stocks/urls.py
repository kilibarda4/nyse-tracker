# stocks/urls.py
from django.urls import path
from . import views
from django.views.generic import TemplateView

# stocks/urls.py
from django.urls import path
from . import views
from django.views.generic import TemplateView

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('stock/', views.get_stock_data, name='get_stock_data'),
    path('send-verification-email/', views.send_verification_email, name='send_verification_email'),
    path('verify-email/<uidb64>/<token>/', views.verify_email, name='verify_email'),
    path('publish-alert/', views.publish_stock_alert, name='publish_stock_alert'),
    path('trigger-alerts/', views.trigger_alert_check, name='trigger_alert_check'),
    path('check-all-alerts/', views.check_all_alerts, name='check_all_alerts'),
]

