package com.talentsphere.common.batch;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class BatchConfig {

    @Bean
    public Job cleanupJob(JobRepository jobRepository, Step cleanupOldDataStep) {
        return new JobBuilder("cleanupOldDataJob", jobRepository)
                .start(cleanupOldDataStep)
                .build();
    }

    @Bean
    public Step cleanupOldDataStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("cleanupOldData", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }

    @Bean
    public Job aggregateMetricsJob(JobRepository jobRepository, Step aggregateMetricsStep) {
        return new JobBuilder("aggregateMetricsJob", jobRepository)
                .start(aggregateMetricsStep)
                .build();
    }

    @Bean
    public Step aggregateMetricsStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("aggregateMetricsStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }

    @Bean
    public Job sendScheduledNotificationsJob(JobRepository jobRepository, Step sendNotificationsStep) {
        return new JobBuilder("sendScheduledNotificationsJob", jobRepository)
                .start(sendNotificationsStep)
                .build();
    }

    @Bean
    public Step sendNotificationsStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("sendNotificationsStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }
}
