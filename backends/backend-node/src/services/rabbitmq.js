const amqp = require('amqplib');
const { config, logger } = require('../config/config');
const { dispatchEvent } = require('./events');

let rabbitConnection = null;
let rabbitChannel = null;

const connectRabbitMQ = async (io) => {
    try {
        rabbitConnection = await amqp.connect(config.RABBITMQ_URL);
        rabbitChannel = await rabbitConnection.createChannel();

        const exchange = 'talentsphere.events';
        await rabbitChannel.assertExchange(exchange, 'topic', { durable: true });

        // Create queue for notification service
        const queue = await rabbitChannel.assertQueue('notification-service-events', { durable: true });

        // Bind to relevant events
        await rabbitChannel.bindQueue(queue.queue, exchange, 'course.*');
        await rabbitChannel.bindQueue(queue.queue, exchange, 'challenge.*');
        await rabbitChannel.bindQueue(queue.queue, exchange, 'progress.*');
        await rabbitChannel.bindQueue(queue.queue, exchange, 'enrollment.*');

        logger.info('Connected to RabbitMQ, listening for events');

        // Consume messages
        rabbitChannel.consume(queue.queue, (msg) => {
            if (msg) {
                try {
                    const event = JSON.parse(msg.content.toString());
                    logger.info(`Received event: ${event.eventType}`, event);
                    dispatchEvent(io, event);
                    rabbitChannel.ack(msg);
                } catch (error) {
                    logger.error('Error processing RabbitMQ message:', error);
                    rabbitChannel.nack(msg, false, false);
                }
            }
        });

    } catch (error) {
        logger.error('Failed to connect to RabbitMQ:', error);
        setTimeout(() => connectRabbitMQ(io), 5000); // Retry after 5 seconds
    }
};

const closeRabbitMQ = async () => {
    if (rabbitChannel) await rabbitChannel.close();
    if (rabbitConnection) await rabbitConnection.close();
};

module.exports = { connectRabbitMQ, closeRabbitMQ };
