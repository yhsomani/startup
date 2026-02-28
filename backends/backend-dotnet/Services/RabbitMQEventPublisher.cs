using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using Microsoft.Extensions.Logging;

namespace TalentSphere.API.Services
{
    public class RabbitMQEventPublisher : IEventPublisher, IDisposable
    {
        private readonly ILogger<RabbitMQEventPublisher> _logger;
        private IConnection? _connection;
        private IChannel? _channel;
        private readonly string _exchangeName = "talentsphere.events";
        private bool _isInitialized = false;

        public RabbitMQEventPublisher(ILogger<RabbitMQEventPublisher> logger)
        {
            _logger = logger;
            try
            {
                var factory = new ConnectionFactory 
                { 
                    HostName = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost",
                    Port = int.TryParse(Environment.GetEnvironmentVariable("RABBITMQ_PORT"), out var port) ? port : 5672
                };
                
                Task.Run(async () => await InitializeAsync()).Wait(5000);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "RabbitMQ not available. Events will be logged only.");
                _isInitialized = false;
            }
        }

        private async Task InitializeAsync()
        {
            try
            {
                var factory = new ConnectionFactory 
                { 
                    HostName = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost",
                    Port = int.TryParse(Environment.GetEnvironmentVariable("RABBITMQ_PORT"), out var port) ? port : 5672
                };
                
                _connection = await factory.CreateConnectionAsync();
                _channel = await _connection.CreateChannelAsync();
                await _channel.ExchangeDeclareAsync(exchange: _exchangeName, type: ExchangeType.Topic, durable: true);
                _isInitialized = true;
                _logger.LogInformation("RabbitMQ connected successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to connect to RabbitMQ");
                _isInitialized = false;
            }
        }

        public async Task PublishEventAsync(string routingKey, object eventData)
        {
            if (!_isInitialized || _channel == null)
            {
                _logger.LogWarning("RabbitMQ not initialized. Event {RoutingKey} logged but not published.", routingKey);
                return;
            }

            try
            {
                var json = JsonSerializer.Serialize(eventData);
                var body = Encoding.UTF8.GetBytes(json);
                
                var properties = new BasicProperties
                {
                    DeliveryMode = DeliveryModes.Persistent,
                    ContentType = "application/json"
                };

                await _channel.BasicPublishAsync(
                    exchange: _exchangeName,
                    routingKey: routingKey,
                    mandatory: false,
                    basicProperties: properties,
                    body: body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish event {RoutingKey}", routingKey);
            }
        }

        public void PublishEvent(string routingKey, object eventData)
        {
            PublishEventAsync(routingKey, eventData).Wait();
        }

        public void Dispose()
        {
            _channel?.CloseAsync();
            _connection?.CloseAsync();
        }
    }
}
