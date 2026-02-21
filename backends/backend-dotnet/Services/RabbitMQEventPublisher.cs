using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using Microsoft.Extensions.Logging;

namespace TalentSphere.API.Services
{
    public class RabbitMQEventPublisher : IEventPublisher, IDisposable
    {
        private readonly IConnection? _connection;
        private readonly IModel? _channel;
        private readonly string _exchangeName = "talentsphere.events";
        private readonly ILogger<RabbitMQEventPublisher> _logger;

        public RabbitMQEventPublisher(ILogger<RabbitMQEventPublisher> logger)
        {
            _logger = logger;
            try
            {
                var factory = new ConnectionFactory { HostName = "localhost" };
                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();
                _channel.ExchangeDeclare(exchange: _exchangeName, type: "topic");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to RabbitMQ");
            }
        }

        public void PublishEvent(string routingKey, object eventData)
        {
            if (_channel == null || _channel.IsClosed)
            {
                _logger.LogWarning("RabbitMQ channel is not open. Event {RoutingKey} dropped.", routingKey);
                return;
            }

            try
            {
                var json = JsonSerializer.Serialize(eventData);
                var body = Encoding.UTF8.GetBytes(json);

                _channel.BasicPublish(exchange: _exchangeName,
                                     routingKey: routingKey,
                                     basicProperties: null,
                                     body: body);
                                     
                _logger.LogInformation("Published event to {RoutingKey}", routingKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish event");
            }
        }

        public void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
        }
    }
}
