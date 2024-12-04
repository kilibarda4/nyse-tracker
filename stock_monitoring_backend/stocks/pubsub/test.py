from google.cloud import pubsub_v1
from tasks import check_alerts
import logging

PROJECT_ID = "spring-nova-435423-t7"
SUBSCRIPTION_ID = "stock-alerts-topic-sub"

subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)


print(f"Subscription path: {subscription_path}")