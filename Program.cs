var builder = WebApplication.CreateBuilder(args);

string myAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: myAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Add your React dev ports
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

// Add services to the container.
builder.Services.AddControllers();

var app = builder.Build();
app.UseCors(myAllowSpecificOrigins);

// Configure the HTTP request pipeline.
app.UseAuthorization();
app.MapControllers();

app.Run();