using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.Services;
using TalentSphere.API.DTOs;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            IPaymentService paymentService,
            ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        [HttpPost("create-payment-intent")]
        public async Task<ActionResult<PaymentIntentDTO>> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.CreatePaymentIntentAsync(userId, request);

                _logger.LogInformation("Payment intent created for user {UserId}, course {CourseId}", userId, request.CourseId);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment intent");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("confirm-payment")]
        public async Task<ActionResult<PaymentConfirmationDTO>> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.ConfirmPaymentAsync(userId, request.PaymentIntentId);

                _logger.LogInformation("Payment confirmed for user {UserId}, payment {PaymentId}", userId, request.PaymentIntentId);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming payment");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("refund")]
        public async Task<ActionResult<RefundDTO>> ProcessRefund([FromBody] RefundPaymentRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.ProcessRefundAsync(userId, request);

                _logger.LogInformation("Refund processed for user {UserId}, payment {PaymentId}", userId, request.PaymentId);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("user/payments")]
        public async Task<ActionResult<List<PaymentDTO>>> GetUserPayments()
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.GetUserPaymentsAsync(userId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user payments");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("create-subscription")]
        public async Task<ActionResult<SubscriptionDTO>> CreateSubscription([FromBody] CreateSubscriptionRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.CreateSubscriptionAsync(userId, request);

                _logger.LogInformation("Subscription created for user {UserId}, tier {Tier}", userId, request.Tier);

                return CreatedAtAction(nameof(GetUserSubscriptions), new { }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating subscription");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("user/subscriptions")]
        public async Task<ActionResult<List<SubscriptionDTO>>> GetUserSubscriptions()
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.GetUserSubscriptionsAsync(userId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user subscriptions");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("cancel-subscription/{subscriptionId}")]
        public async Task<ActionResult<SubscriptionDTO>> CancelSubscription(
            Guid subscriptionId,
            [FromBody] CancelSubscriptionRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.CancelSubscriptionAsync(userId, subscriptionId, request);

                _logger.LogInformation("Subscription cancelled for user {UserId}, subscription {SubscriptionId}", userId, subscriptionId);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling subscription");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("user/subscription-stats")]
        public async Task<ActionResult<UserSubscriptionStats>> GetUserSubscriptionStats()
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _paymentService.GetUserSubscriptionStatsAsync(userId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user subscription stats");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<ActionResult<PaymentWebhookResponse>> ProcessWebhook()
        {
            try
            {
                var stripeSignature = Request.Headers["Stripe-Signature"];
                if (string.IsNullOrEmpty(stripeSignature))
                {
                    return BadRequest(new { Message = "Stripe signature required" });
                }

                using var reader = new StreamReader(Request.Body);
                var requestBody = await reader.ReadToEndAsync();

                var result = await _paymentService.ProcessWebhookEventAsync(stripeSignature, requestBody);

                _logger.LogInformation("Webhook processed: {EventId}", result.ProcessedEventId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }
    }
}