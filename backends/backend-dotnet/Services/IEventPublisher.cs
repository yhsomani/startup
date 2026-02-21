namespace TalentSphere.API.Services
{
    public interface IEventPublisher
    {
        void PublishEvent(string routingKey, object eventData);
    }
}
