package com.talentsphere.backend.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "talentsphere.events"; // Kept as it's used by eventExchange()
    public static final String PROGRESS_QUEUE = "progress.update.queue";
    public static final String CERTIFICATE_QUEUE = "certificate.generation.queue";
    public static final String DLQ_NAME = "talentsphere.deadletter.queue";
    public static final String DLX_NAME = "talentsphere.deadletter.exchange";
    public static final String ROUTING_KEY_PROGRESS = "progress.updated";
    public static final String ROUTING_KEY_COURSE_COMPLETED = "course.completed";

    @Bean
    public TopicExchange eventExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return new TopicExchange(DLX_NAME);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ_NAME).build();
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange()).with("#");
    }

    @Bean
    public Queue progressQueue() {
        return QueueBuilder.durable(PROGRESS_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_NAME)
                .withArgument("x-dead-letter-routing-key", "dead.progress")
                .build();
    }

    @Bean
    public Queue certificateQueue() {
        return QueueBuilder.durable(CERTIFICATE_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_NAME)
                .withArgument("x-dead-letter-routing-key", "dead.certificate")
                .build();
    }

    @Bean
    public Binding certificateBinding(Queue certificateQueue, TopicExchange eventExchange) {
        return BindingBuilder.bind(certificateQueue).to(eventExchange)
                .with(ROUTING_KEY_COURSE_COMPLETED);
    }
}
