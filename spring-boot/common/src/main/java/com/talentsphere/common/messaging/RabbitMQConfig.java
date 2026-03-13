package com.talentsphere.common.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "talentsphere.events";
    public static final String QUEUE_NAME = "talentsphere.notifications";
    public static final String DLQ_NAME = "talentsphere.notifications.dlq";
    public static final String ROUTING_KEY = "notification.#";
    public static final String DLQ_ROUTING_KEY = "notification.dlq";

    @Bean
    public TopicExchange talentsphereExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue notificationQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", EXCHANGE_NAME);
        args.put("x-dead-letter-routing-key", DLQ_ROUTING_KEY);
        return new Queue(QUEUE_NAME, true, false, false, args);
    }

    @Bean
    public Queue deadLetterQueue() {
        return new Queue(DLQ_NAME, true);
    }

    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange talentsphereExchange) {
        return BindingBuilder.bind(notificationQueue).to(talentsphereExchange).with(ROUTING_KEY);
    }

    @Bean
    public Binding dlqBinding(Queue deadLetterQueue, TopicExchange talentsphereExchange) {
        return BindingBuilder.bind(deadLetterQueue).to(talentsphereExchange).with(DLQ_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        template.setExchange(EXCHANGE_NAME);
        return template;
    }
}
