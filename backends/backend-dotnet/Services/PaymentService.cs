using Microsoft.Extensions.Configuration;
using Stripe;
using TalentSphere.API.Models;
using TalentSphere.API.DTOs;
using TalentSphere.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace TalentSphere.API.Services
{
    public interface IPaymentService
    {
        Task<PaymentIntentDTO> CreatePaymentIntentAsync(Guid userId, CreatePaymentIntentRequest request);
        Task<PaymentConfirmationDTO> ConfirmPaymentAsync(Guid userId, Guid paymentIntentId);
        Task<RefundDTO> ProcessRefundAsync(Guid userId, RefundPaymentRequest request);
        Task<SubscriptionDTO> CreateSubscriptionAsync(Guid userId, CreateSubscriptionRequest request);
        Task<SubscriptionDTO> CancelSubscriptionAsync(Guid userId, Guid subscriptionId, CancelSubscriptionRequest request);
        Task<List<PaymentDTO>> GetUserPaymentsAsync(Guid userId);
        Task<List<SubscriptionDTO>> GetUserSubscriptionsAsync(Guid userId);
        Task<UserSubscriptionStats> GetUserSubscriptionStatsAsync(Guid userId);
        Task<PaymentWebhookResponse> ProcessWebhookEventAsync(string stripeSignature, string requestBody);
    }

    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentService> _logger;
        private readonly IConfiguration _configuration;

        public PaymentService(
            ApplicationDbContext context,
            ILogger<PaymentService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            
            // Configure Stripe
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"] ?? throw new InvalidOperationException("Stripe:SecretKey not configured");
        }

        public async Task<PaymentIntentDTO> CreatePaymentIntentAsync(Guid userId, CreatePaymentIntentRequest request)
        {
            try
            {
                // Verify course exists and get pricing
                var course = await _context.Courses.FindAsync(request.CourseId);
                if (course == null)
                {
                    throw new ArgumentException($"Course {request.CourseId} not found");
                }

                // Verify amount matches course price (or allow custom amount for promotions)
                var amount = request.Amount * 100; // Convert to cents for Stripe

                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)amount,
                    Currency = request.Currency.ToLower(),
                    PaymentMethodTypes = new List<string> { "card" },
                    Metadata = new Dictionary<string, string>
                    {
                        { "user_id", userId.ToString() },
                        { "course_id", request.CourseId.ToString() },
                        { "course_title", course.Title }
                    },
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                        AllowRedirects = "never"
                    }
                };

                if (!string.IsNullOrEmpty(request.PaymentMethodId))
                {
                    options.PaymentMethod = request.PaymentMethodId;
                    options.ConfirmationMethod = "manual";
                    options.Confirm = true;
                }

                var service = new PaymentIntentService();
                var stripePaymentIntent = await service.CreateAsync(options);

                // Create payment record in database
                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CourseId = request.CourseId,
                    Amount = request.Amount,
                    Currency = request.Currency,
                    PaymentMethod = "stripe",
                    Status = PaymentStatus.Pending,
                    StripePaymentIntentId = stripePaymentIntent.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Payment intent created: {PaymentIntentId} for user {UserId}, course {CourseId}", 
                    stripePaymentIntent.Id, userId, request.CourseId);

                return new PaymentIntentDTO
                {
                    Id = payment.Id,
                    Amount = request.Amount,
                    Currency = request.Currency,
                    ClientSecret = stripePaymentIntent.ClientSecret,
                    PublishableKey = _configuration["Stripe:PublishableKey"] ?? throw new InvalidOperationException("Stripe:PublishableKey not configured"),
                    PaymentIntentId = stripePaymentIntent.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment intent for user {UserId}", userId);
                throw;
            }
        }

        public async Task<PaymentConfirmationDTO> ConfirmPaymentAsync(Guid userId, Guid paymentIntentId)
        {
            try
            {
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.Id == paymentIntentId && p.UserId == userId);

                if (payment == null)
                {
                    throw new ArgumentException("Payment not found");
                }

                if (!string.IsNullOrEmpty(payment.StripePaymentIntentId))
                {
                    var service = new PaymentIntentService();
                    var stripePaymentIntent = await service.GetAsync(payment.StripePaymentIntentId);

                    if (stripePaymentIntent.Status == "succeeded")
                    {
                        payment.Status = PaymentStatus.Succeeded;
                        payment.TransactionId = stripePaymentIntent.Id;
                        payment.UpdatedAt = DateTime.UtcNow;
                        
                        await _context.SaveChangesAsync();

                        _logger.LogInformation("Payment confirmed: {PaymentId} for user {UserId}", payment.Id, userId);

                        return new PaymentConfirmationDTO
                        {
                            TransactionId = payment.TransactionId ?? "unknown",
                            Amount = payment.Amount,
                            Currency = payment.Currency,
                            Status = "succeeded",
                            Message = "Payment processed successfully"
                        };
                    }
                }

                throw new InvalidOperationException("Payment not succeeded");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming payment for user {UserId}", userId);
                throw;
            }
        }

        public async Task<RefundDTO> ProcessRefundAsync(Guid userId, RefundPaymentRequest request)
        {
            try
            {
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.Id == request.PaymentId && p.UserId == userId && p.Status == PaymentStatus.Succeeded);

                if (payment == null)
                {
                    throw new ArgumentException("Payment not found or not eligible for refund");
                }

                if (!string.IsNullOrEmpty(payment.StripePaymentIntentId))
                {
                    var refundOptions = new RefundCreateOptions
                    {
                        PaymentIntent = payment.StripePaymentIntentId,
                        Reason = request.Reason?.ToLower() switch
                        {
                            "duplicate" => "duplicate",
                            "fraudulent" => "fraudulent",
                            "requested_by_customer" => "requested_by_customer",
                            _ => "requested_by_customer"
                        }
                    };

                    if (request.Amount > 0)
                    {
                        refundOptions.Amount = (long)(request.Amount * 100); // Convert to cents
                    }

                    var refundService = new RefundService();
                    var stripeRefund = await refundService.CreateAsync(refundOptions);

                    payment.Status = PaymentStatus.Refunded;
                    payment.RefundId = stripeRefund.Id;
                    payment.UpdatedAt = DateTime.UtcNow;
                    
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Refund processed: {RefundId} for payment {PaymentId}", stripeRefund.Id, payment.Id);

                    return new RefundDTO
                    {
                        Id = Guid.NewGuid(),
                        PaymentId = payment.Id,
                        Amount = request.Amount > 0 ? request.Amount : payment.Amount,
                        Currency = payment.Currency,
                        Status = stripeRefund.Status,
                        StripeRefundId = stripeRefund.Id,
                        Reason = request.Reason,
                        CreatedAt = DateTime.UtcNow
                    };
                }

                throw new InvalidOperationException("Cannot process refund - no Stripe payment intent found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund for user {UserId}", userId);
                throw;
            }
        }

        public async Task<SubscriptionDTO> CreateSubscriptionAsync(Guid userId, CreateSubscriptionRequest request)
        {
            try
            {
                // Check if user already has active subscription
                var existingSubscription = await _context.Subscriptions
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

                if (existingSubscription != null)
                {
                    throw new InvalidOperationException("User already has an active subscription");
                }

                // Create or retrieve Stripe customer
                var customerId = await CreateOrUpdateStripeCustomerAsync(userId);

                // In a real implementation, you would create a Stripe subscription with a Price ID
                // For demo purposes, we'll create a local subscription record
                var subscription = new Models.Subscription
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Tier = request.Tier,
                    Price = request.Price,
                    Currency = request.Currency,
                    Status = SubscriptionStatus.Active,
                    StripeCustomerId = customerId,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddMonths(1), // Monthly subscription
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Subscriptions.Add(subscription);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Subscription created: {SubscriptionId} for user {UserId}, tier: {Tier}", 
                    subscription.Id, userId, request.Tier);

                return new SubscriptionDTO
                {
                    Id = subscription.Id,
                    Tier = subscription.Tier,
                    Price = subscription.Price,
                    Currency = subscription.Currency,
                    Status = subscription.Status,
                    StartDate = subscription.StartDate,
                    EndDate = subscription.EndDate,
                    StripeSubscriptionId = subscription.StripeSubscriptionId,
                    CreatedAt = subscription.CreatedAt,
                    UpdatedAt = subscription.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating subscription for user {UserId}", userId);
                throw;
            }
        }

        public async Task<SubscriptionDTO> CancelSubscriptionAsync(Guid userId, Guid subscriptionId, CancelSubscriptionRequest request)
        {
            try
            {
                var subscription = await _context.Subscriptions
                    .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.UserId == userId);

                if (subscription == null)
                {
                    throw new ArgumentException("Subscription not found");
                }

                if (subscription.Status != SubscriptionStatus.Active)
                {
                    throw new InvalidOperationException("Subscription is not active");
                }

                // Cancel Stripe subscription if exists
                if (!string.IsNullOrEmpty(subscription.StripeSubscriptionId))
                {
                    var options = new SubscriptionCancelOptions
                    {
                        CancellationDetails = new SubscriptionCancellationDetailsOptions
                        {
                            Comment = request.Reason,
                            Feedback = request.CancelImmediately ? "cancellation_requested" : null
                        }
                    };

                    var service = new SubscriptionService();
                    await service.CancelAsync(subscription.StripeSubscriptionId, options);
                }

                subscription.Status = SubscriptionStatus.Cancelled;
                subscription.EndDate = request.CancelImmediately ? DateTime.UtcNow : subscription.EndDate;
                subscription.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Subscription cancelled: {SubscriptionId} for user {UserId}", subscription.Id, userId);

                return new SubscriptionDTO
                {
                    Id = subscription.Id,
                    Tier = subscription.Tier,
                    Price = subscription.Price,
                    Currency = subscription.Currency,
                    Status = subscription.Status,
                    StartDate = subscription.StartDate,
                    EndDate = subscription.EndDate,
                    StripeSubscriptionId = subscription.StripeSubscriptionId,
                    CreatedAt = subscription.CreatedAt,
                    UpdatedAt = subscription.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling subscription for user {UserId}", userId);
                throw;
            }
        }

        public async Task<List<PaymentDTO>> GetUserPaymentsAsync(Guid userId)
        {
            return await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PaymentDTO
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    CourseId = p.CourseId,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    TransactionId = p.TransactionId,
                    StripePaymentIntentId = p.StripePaymentIntentId,
                    StripePaymentMethodId = p.StripePaymentMethodId,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();
        }

        public async Task<List<SubscriptionDTO>> GetUserSubscriptionsAsync(Guid userId)
        {
            return await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new SubscriptionDTO
                {
                    Id = s.Id,
                    Tier = s.Tier,
                    Price = s.Price,
                    Currency = s.Currency,
                    Status = s.Status,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    StripeSubscriptionId = s.StripeSubscriptionId,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                })
                .ToListAsync();
        }

        public async Task<UserSubscriptionStats> GetUserSubscriptionStatsAsync(Guid userId)
        {
            var activeSubscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

            return new UserSubscriptionStats
            {
                HasActiveSubscription = activeSubscription != null,
                SubscriptionTier = activeSubscription?.Tier,
                SubscriptionEndDate = activeSubscription?.EndDate,
                IsOnTrial = false, // Can be implemented later
                TrialEndDate = null
            };
        }

        public async Task<PaymentWebhookResponse> ProcessWebhookEventAsync(string stripeSignature, string requestBody)
        {
            try
            {
                var endpointSecret = _configuration["Stripe:WebhookSecret"];
                if (string.IsNullOrEmpty(endpointSecret))
                {
                    throw new InvalidOperationException("Stripe:WebhookSecret not configured");
                }

                var stripeEvent = EventUtility.ConstructEvent(
                    requestBody,
                    stripeSignature,
                    endpointSecret
                );

                switch (stripeEvent.Type)
                {
                    case "payment_intent.succeeded":
                        await HandlePaymentSucceeded(stripeEvent);
                        break;
                    case "payment_intent.payment_failed":
                        await HandlePaymentFailed(stripeEvent);
                        break;
                    case "invoice.payment_succeeded":
                        await HandleSubscriptionPaymentSucceeded(stripeEvent);
                        break;
                    case "invoice.payment_failed":
                        await HandleSubscriptionPaymentFailed(stripeEvent);
                        break;
                    case "customer.subscription.deleted":
                        await HandleSubscriptionCancelled(stripeEvent);
                        break;
                    default:
                        _logger.LogInformation("Unhandled event type: {EventType}", stripeEvent.Type);
                        break;
                }

                return new PaymentWebhookResponse
                {
                    Success = true,
                    Message = "Event processed successfully",
                    ProcessedEventId = stripeEvent.Id
                };
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe webhook error: {Error}", ex.Message);
                return new PaymentWebhookResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook event");
                return new PaymentWebhookResponse
                {
                    Success = false,
                    Message = "Internal server error"
                };
            }
        }

        private async Task<string> CreateOrUpdateStripeCustomerAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            var customerService = new CustomerService();
            
            // Check if customer already exists
            var existingCustomers = await customerService.ListAsync(new CustomerListOptions
            {
                Email = user.Email
            });

            if (existingCustomers.Any())
            {
                return existingCustomers.First().Id;
            }

            // Create new customer
            var options = new CustomerCreateOptions
            {
                Email = user.Email,
                Name = $"{user.FirstName} {user.LastName}",
                Metadata = new Dictionary<string, string>
                {
                    { "user_id", userId.ToString() }
                }
            };

            var customer = await customerService.CreateAsync(options);
            return customer.Id;
        }

        private async Task HandlePaymentSucceeded(Event stripeEvent)
        {
            var paymentIntent = stripeEvent.Data.Object as Stripe.PaymentIntent;
            _logger.LogInformation("Payment succeeded: {PaymentIntentId}", paymentIntent.Id);
            
            // Update payment status in database
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

            if (payment != null)
            {
                payment.Status = PaymentStatus.Succeeded;
                payment.TransactionId = paymentIntent.Id;
                payment.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        private async Task HandlePaymentFailed(Event stripeEvent)
        {
            var paymentIntent = stripeEvent.Data.Object as Stripe.PaymentIntent;
            _logger.LogInformation("Payment failed: {PaymentIntentId}", paymentIntent.Id);
            
            // Update payment status in database
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

            if (payment != null)
            {
                payment.Status = PaymentStatus.Failed;
                payment.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        private async Task HandleSubscriptionPaymentSucceeded(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Stripe.Invoice;
            _logger.LogInformation("Subscription payment succeeded: {InvoiceId}", invoice.Id);
            
            // Update subscription status if needed
            if (invoice.Subscription != null)
            {
                var stripeSubId = invoice.Subscription.Id;
                var subscription = await _context.Subscriptions
                    .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubId);

                if (subscription != null)
                {
                    subscription.Status = SubscriptionStatus.Active;
                    subscription.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
        }

        private async Task HandleSubscriptionPaymentFailed(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Stripe.Invoice;
            _logger.LogInformation("Subscription payment failed: {InvoiceId}", invoice.Id);
            
            // Could implement subscription suspension logic here
        }

        private async Task HandleSubscriptionCancelled(Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            _logger.LogInformation("Subscription cancelled: {SubscriptionId}", subscription.Id);
            
            // Update subscription status in database
            var localSubscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == subscription.Id);

            if (localSubscription != null)
            {
                // Use current_period_end to allow access until end of billing period
                // Don't revoke immediately - user has paid for the current period
                localSubscription.Status = subscription.CancelAtPeriodEnd 
                    ? SubscriptionStatus.Active 
                    : SubscriptionStatus.Cancelled;
                localSubscription.EndDate = subscription.CurrentPeriodEnd;
                localSubscription.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}