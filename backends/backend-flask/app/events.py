"""
Event Publishing Utilities

Handles publishing events to RabbitMQ with:
- Event ID for idempotency
- Correlation ID for tracing
- Timestamp for ordering
- Retry support
"""
import pika
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from flask import g, has_request_context

# Configure logging
logger = logging.getLogger(__name__)


def get_correlation_id() -> str:
    """Get correlation ID from request context or generate new one."""
    if has_request_context() and hasattr(g, 'request_id'):
        return g.request_id
    return str(uuid.uuid4())


def create_event(
    event_type: str,
    payload: Dict[str, Any],
    user_id: Optional[str] = None,
    idempotency_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a standardized event envelope.

    Args:
        event_type: Type of event (e.g., 'challenge.completed', 'user.registered')
        payload: Event-specific data
        user_id: User who triggered the event
        idempotency_key: Optional key for deduplication (auto-generated if not provided)

    Returns:
        Event envelope with metadata
    """
    event_id = str(uuid.uuid4())

    return {
        'event_id': event_id,
        'idempotency_key': idempotency_key or event_id,
        'type': event_type,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'correlation_id': get_correlation_id(),
        'source': 'flask-backend',
        'user_id': user_id,
        'payload': payload,
        'version': '1.0',
    }


def publish_event(
    routing_key: str,
    event_data: Dict[str, Any],
    user_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    retry_count: int = 3
) -> bool:
    """
    Publish an event to RabbitMQ with retry support.

    Args:
        routing_key: Topic routing key (e.g., 'challenge.completed')
        event_data: Event payload (will be wrapped in envelope if not already)
        user_id: User who triggered the event
        idempotency_key: Key for deduplication
        retry_count: Number of retry attempts

    Returns:
        True if published successfully, False otherwise
    """
    # Wrap in envelope if not already wrapped
    if 'event_id' not in event_data:
        event = create_event(
            event_type=routing_key,
            payload=event_data,
            user_id=user_id,
            idempotency_key=idempotency_key
        )
    else:
        event = event_data

    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))

    for attempt in range(retry_count):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=rabbitmq_host,
                    port=rabbitmq_port,
                    connection_attempts=3,
                    retry_delay=1
                )
            )
            channel = connection.channel()

            # Declare exchange (idempotent)
            channel.exchange_declare(
                exchange='talentsphere.events',
                exchange_type='topic',
                durable=True
            )

            # Publish with persistence
            message = json.dumps(event, default=str)
            channel.basic_publish(
                exchange='talentsphere.events',
                routing_key=routing_key,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Persistent
                    content_type='application/json',
                    message_id=event['event_id'],
                    correlation_id=event['correlation_id'],
                    timestamp=int(datetime.utcnow().timestamp()),
                )
            )

            logger.info(
                f"Published event {routing_key} | "
                f"event_id={event['event_id']} | "
                f"correlation_id={event['correlation_id']}"
            )
            connection.close()
            return True

        except pika.exceptions.AMQPConnectionError as e:
            logger.warning(
                f"RabbitMQ connection failed (attempt {attempt + 1}/{retry_count}): {e}"
            )
            if attempt == retry_count - 1:
                logger.error(
                    f"Failed to publish event after {retry_count} attempts: "
                    f"routing_key={routing_key}, event_id={event.get('event_id')}"
                )
                return False
        except (pika.exceptions.AMQPChannelError, json.JSONDecodeError) as e:
            logger.error(f"Unrecoverable error publishing event: {e}")
            return False

    return False


# Event type constants for type safety
class EventTypes:
    """Standard event types for the platform."""

    # Auth events
    USER_REGISTERED = 'user.registered'
    USER_LOGGED_IN = 'user.logged_in'

    # Challenge events
    CHALLENGE_STARTED = 'challenge.started'
    CHALLENGE_COMPLETED = 'challenge.completed'
    CHALLENGE_FAILED = 'challenge.failed'

    # Course events
    COURSE_ENROLLED = 'course.enrolled'
    COURSE_COMPLETED = 'course.completed'
    LESSON_COMPLETED = 'lesson.completed'

    # Gamification events
    POINTS_EARNED = 'gamification.points_earned'
    BADGE_EARNED = 'gamification.badge_earned'
    STREAK_UPDATED = 'gamification.streak_updated'

