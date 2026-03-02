using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TalentSphere.API.Data;
using TalentSphere.API.Services;
using TalentSphere.API.Middleware;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpContextAccessor();

// Services
builder.Services.AddSingleton<IEventPublisher, RabbitMQEventPublisher>();
builder.Services.AddSingleton<RabbitMQPublisherService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CourseService>();
builder.Services.AddScoped<ProgressService>();
builder.Services.AddScoped<ChallengeService>();
builder.Services.AddSingleton<VideoService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IDiscussionService, DiscussionService>();

// Database - Support DATABASE_URL env var (Render/Cloud deployment)
var defaultConnection = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(defaultConnection))
{
    throw new InvalidOperationException("DATABASE_URL environment variable or DefaultConnection is not configured");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(defaultConnection));

// CORS Configuration - DISABLED: Nginx API Gateway handles CORS
// Enabling CORS here would cause duplicate headers
// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowAll", policy =>
//     {
//         policy.AllowAnyOrigin()
//               .AllowAnyMethod()
//               .AllowAnyHeader();
//     });
// });

// JWT Config - Use environment variable with fallback to config
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
    ?? builder.Configuration["Jwt:Secret"];

if (string.IsNullOrEmpty(jwtSecret))
{
    throw new InvalidOperationException("JWT_SECRET environment variable is not configured");
}

var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Verify database connection on startup
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.CanConnect();
        Console.WriteLine("✅ Database connection verified");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Database connection check failed: {ex.Message}");
    Console.WriteLine("ℹ️  Database schema is managed by Flask (backend-flask)");
}

// Register middleware (order matters!)
app.UseCorrelationId();  // First: set correlation ID
app.UseGlobalExceptionHandler();  // Second: catch all exceptions

app.UseHttpsRedirection();
app.UseStaticFiles(); // Enable serving HLS files from wwwroot

app.UseAuthentication();
app.UseRouting();

app.UseMetricServer();
app.UseHttpMetrics();

// app.UseCors("AllowAll"); // DISABLED: Nginx handles CORS

app.UseAuthorization();

app.MapControllers();

app.Run();
