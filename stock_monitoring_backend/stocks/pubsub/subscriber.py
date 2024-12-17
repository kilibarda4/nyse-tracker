from google.cloud import pubsub_v1
import logging
from tasks import check_alerts
import json


#cd cloudcomputingproj
#.\env\scripts\Activate
#cd stock_monitoring_backend/stocks/pubsub
# python subscriber.py

logging.basicConfig(level=logging.INFO)

PROJECT_ID = "spring-nova-435423-t7"
SUBSCRIPTION_ID = "stock-alerts-topic-sub"

def pull_messages():
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)

    def callback(message):
        logging.info(f"Received message: {message.data}")
        try:
            alert_data = json.loads(message.data)
            check_alerts()
            # Replace with your message processing logic
            message.ack()
            logging.info(f"Message acknowledged: {message.data}")
        except Exception as e:
            logging.error(f"Error processing message: {e}")

    try:
        logging.info(f"Listening for messages on {subscription_path}...")
        future = subscriber.subscribe(subscription_path, callback=callback)
        future.result()  # This blocks
    except Exception as e:
        logging.error(f"Subscriber encountered an error: {e}")
    finally:
        subscriber.close()

if __name__ == "__main__":
    pull_messages()
