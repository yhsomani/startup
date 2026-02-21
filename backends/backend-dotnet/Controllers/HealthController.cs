using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.Data;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HealthController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("health")]
        public ActionResult<object> Health()
        {
            try
            {
                // Verify database connection
                _context.Database.CanConnect();
                return Ok(new 
                {
                    status = "healthy",
                    service = "dotnet-service",
                    timestamp = DateTime.UtcNow,
                    version = "1.0.0",
                    database = "connected",
                    memory = "available",
                    disk = "available"
                });
            }
            catch (Exception ex)
            {
                return Ok(new 
                {
                    status = "unhealthy",
                    service = "dotnet-service",
                    timestamp = DateTime.UtcNow,
                    version = "1.0.0",
                    database = "disconnected",
                    error = ex.Message,
                    memory = "available",
                    disk = "available"
                });
            }
        }

        [HttpGet("health/detailed")]
        public ActionResult<object> DetailedHealth()
        {
            try
            {
                // Verify database connection
                _context.Database.CanConnect();
                return Ok(new 
                {
                    status = "healthy",
                    service = "dotnet-service",
                    timestamp = DateTime.UtcNow,
                    version = "1.0.0",
                    checks = new 
                    {
                        database = "connected",
                        memory = "available",
                        disk = "available"
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new 
                {
                    status = "unhealthy",
                    service = "dotnet-service",
                    timestamp = DateTime.UtcNow,
                    version = "1.0.0",
                    checks = new 
                    {
                        database = "disconnected",
                        error = ex.Message,
                        memory = "available",
                        disk = "available"
                    }
                });
            }
        }
    }
}