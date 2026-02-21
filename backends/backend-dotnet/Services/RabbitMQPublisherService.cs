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
        private IModel? _channel;

        public RabbitMQPublisherService(ILogger<RabbitMQPublisherService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            Initialize();
        }

        private void Initialize()
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _configuration["RabbitMQ:Host"] ?? "localhost",
                    Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
                    UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                    Password = _configuration["RabbitMQ:Password"] ?? "guest"
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                // Declare the exchange (topic exchange for routing events)
                _channel.ExchangeDeclare(
                    exchange: "talentsphere.events",
                    type: ExchangeType.Topic,
                    durable: true,
                    autoDelete: false
                );

                _logger.LogInformation("RabbitMQ connection established");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize RabbitMQ connection");
            }
        }

        public void PublishEvent(string routingKey, object eventData)
        {
            try
            {
                if (_channel == null)
                {
                    _logger.LogWarning("RabbitMQ channel not initialized, skipping event publish");
                    return;
                }

                var message = JsonSerializer.Serialize(eventData);
                var body = Encoding.UTF8.GetBytes(message);

                var properties = _channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.ContentType = "application/json";

                _channel.BasicPublish(
                    exchange: "talentsphere.events",
                    routingKey: routingKey,
                    basicProperties: properties,
                    body: body
                );

                _logger.LogInformation("Published event to {RoutingKey}: {Message}", routingKey, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish event to {RoutingKey}", routingKey);
                // Fail gracefully - don't break main logic if message queue is down
            }
        }

        public void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
        }
    }
}
