using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace TalentSphere.API.Services
{
    public class RabbitMQPublisherService
    {
        private readonly ILogger<RabbitMQPublisherService> _logger;
        private readonly IConfiguration _configuration;
        private IConnection? _connection;
        private IChannel? _channel;
        private bool _isInitialized = false;

        public RabbitMQPublisherService(ILogger<RabbitMQPublisherService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            Task.Run(async () => await InitializeAsync()).Wait(5000);
        }

        private async Task InitializeAsync()
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _configuration["RabbitMQ:Host"] ?? Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost",
                    Port = int.TryParse(_configuration["RabbitMQ:Port"] ?? Environment.GetEnvironmentVariable("RABBITMQ_PORT"), out var port) ? port : 5672,
                    UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                    Password = _configuration["RabbitMQ:Password"] ?? "guest"
                };

                _connection = await factory.CreateConnectionAsync();
                _channel = await _connection.CreateChannelAsync();

                await _channel.ExchangeDeclareAsync(
                    exchange: "talentsphere.events",
                    type: ExchangeType.Topic,
                    durable: true,
                    autoDelete: false
                );

                _isInitialized = true;
                _logger.LogInformation("RabbitMQ connection established");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize RabbitMQ. Events will be logged only.");
                _isInitialized = false;
            }
        }

        public async Task PublishAsync(string exchange, string routingKey, object message)
        {
            if (!_isInitialized || _channel == null)
            {
                _logger.LogWarning("RabbitMQ not initialized. Event {RoutingKey} logged but not published.", routingKey);
                return;
            }

            try
            {
                var json = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(json);

                var properties = new BasicProperties
                {
                    DeliveryMode = DeliveryModes.Persistent,
                    ContentType = "application/json"
                };

                await _channel.BasicPublishAsync(
                    exchange: exchange,
                    routingKey: routingKey,
                    mandatory: false,
                    basicProperties: properties,
                    body: body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish message to {Exchange}/{RoutingKey}", exchange, routingKey);
            }
        }

        public void Publish(string exchange, string routingKey, object message)
        {
            PublishAsync(exchange, routingKey, message).Wait();
        }

        public async Task CloseAsync()
        {
            if (_channel != null)
            {
                await _channel.CloseAsync();
            }
            if (_connection != null)
            {
                await _connection.CloseAsync();
            }
        }
    }
}
