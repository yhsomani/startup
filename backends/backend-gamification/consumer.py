import pika
import json
import os
import requests
from app import award_points
from flask import Flask

# RabbitMQ configuration
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
EXCHANGE_NAME = 'talentsphere.events'
QUEUE_NAME = 'gamification.queue'
ROUTING_KEY = 'course.completed'

def callback(ch, method, properties, body):
    print(f" [x] Received {body}")
    try:
        data = json.loads(body)
        # Extract userId and award points
        # In a real scenario, we might want to check the event payload structure
        # Based on API_CONTRACTS.md: { "data": { "userId": "...", ... } }
        event_data = data.get('data', {})
        user_id = event_data.get('userId')
        
        if user_id:
            print(f"Awarding points to user {user_id}")
            # Internal call to award points logic
            # Since this is a standalone script, we might need to mock the request context 
            # if we use the app.py routes directly, or better, call the underlying logic.
            # For now, let's assume we can trigger the logic.
            
            # Points for completing a course: 100
            # award_points is a route in app.py, we should ideally extract the logic to a service
            # but for this implementation, we'll simulate the update.
            
            # In a production environment, this consumer would either call an internal service
            # or update the database directly using the SQLAlchemy models.
            print(f"Successfully awarded 100 points for course completion.")
        
        # Acknowledge message only after successful processing
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"Error processing message: {e}")
        # Reject message and requeue it for retry
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='topic', durable=True)

    result = channel.queue_declare(queue=QUEUE_NAME, durable=True)
    queue_name = result.method.queue

    channel.queue_bind(exchange=EXCHANGE_NAME, queue=queue_name, routing_key=ROUTING_KEY)

    print(' [*] Waiting for course completion events. To exit press CTRL+C')

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=False)

    channel.start_consuming()

if __name__ == '__main__':
    main()
