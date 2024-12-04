from google.cloud import pubsub_v1

PROJECT_ID = "spring-nova-435423-t7"
TOPIC_ID = "stock-alerts-topic"

def publish_message(message_data):
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)

    # Publish message
    future = publisher.publish(topic_path, data=message_data.encode('utf-8'))
    print(f"Published message with ID: {future.result()}")
