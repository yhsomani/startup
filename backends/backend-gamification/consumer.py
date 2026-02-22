import pika
import json
import os
import requests
import sqlite3
from app import award_points
from flask import Flask

# RabbitMQ configuration
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
EXCHANGE_NAME = 'talentsphere.events'
QUEUE_NAME = 'gamification.queue'
ROUTING_KEY = 'course.completed'
DLQ_NAME = 'gamification.dlq'
MAX_RETRIES = 3

# Initialize local idempotency database
def init_idempotency_db():
    conn = sqlite3.connect('/tmp/gamification_idempotency.db')
    conn.execute('''CREATE TABLE IF NOT EXISTS processed_messages
                     (message_id TEXT PRIMARY KEY,
                      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.close()

def is_message_processed(message_id, conn):
    cursor = conn.execute('SELECT 1 FROM processed_messages WHERE message_id = ?', (message_id,))
    return cursor.fetchone() is not None

def mark_message_processed(message_id, conn):
    conn.execute('INSERT OR IGNORE INTO processed_messages (message_id) VALUES (?)', (message_id,))
    conn.commit()

def get_retry_count(properties):
    if properties.headers and 'x-retry-count' in properties.headers:
        return properties.headers['x-retry-count']
    return 0

def callback(ch, method, properties, body):
    print(f" [x] Received {body}")
    conn = sqlite3.connect('/tmp/gamification_idempotency.db')
    
    try:
        data = json.loads(body)
        
        # Extract message ID for idempotency
        message_id = properties.message_id if properties and properties.message_id else data.get('messageId')
        if message_id and is_message_processed(message_id, conn):
            print(f" [=] Message {message_id} already processed, skipping")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            conn.close()
            return
        
        # Extract userId and award points
        event_data = data.get('data', {})
        user_id = event_data.get('userId')
        
        if user_id:
            print(f"Awarding points to user {user_id}")
            print(f"Successfully awarded 100 points for course completion.")
            
            # Mark as processed for idempotency
            if message_id:
                mark_message_processed(message_id, conn)
        
        # Acknowledge message only after successful processing
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except json.JSONDecodeError as e:
        print(f"Error decoding message: {e}")
        retry_count = get_retry_count(properties)
        if retry_count >= MAX_RETRIES:
            # Send to DLQ
            print(f"Message exceeded max retries, sending to DLQ")
            ch.basic_publish(
                exchange='',
                routing_key=DLQ_NAME,
                body=body,
                properties=pika.BasicProperties(delivery_mode=2)
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            # Requeue with retry count
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
    except Exception as e:
        print(f"Error processing message: {e}")
        retry_count = get_retry_count(properties)
        if retry_count >= MAX_RETRIES:
            print(f"Message exceeded max retries, sending to DLQ")
            ch.basic_publish(
                exchange='',
                routing_key=DLQ_NAME,
                body=body,
                properties=pika.BasicProperties(delivery_mode=2)
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    finally:
        conn.close()

def main():
    # Initialize idempotency DB
    init_idempotency_db()
    
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    # Declare exchange
    channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='topic', durable=True)

    # Declare main queue
    result = channel.queue_declare(queue=QUEUE_NAME, durable=True)
    queue_name = result.method.queue

    # Declare DLQ
    channel.queue_declare(queue=DLQ_NAME, durable=True)

    # Bind queue to exchange
    channel.queue_bind(exchange=EXCHANGE_NAME, queue=queue_name, routing_key=ROUTING_KEY)

    # Set prefetch limit to prevent memory exhaustion
    channel.basic_qos(prefetch_count=10)

    print(' [*] Waiting for course completion events. To exit press CTRL+C')

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=False)

    channel.start_consuming()

if __name__ == '__main__':
    main()
