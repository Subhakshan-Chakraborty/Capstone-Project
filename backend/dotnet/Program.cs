using MySql.Data.MySqlClient;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8003);
});

builder.Services.AddCors();

var app = builder.Build();

app.UseCors(policy =>
    policy.AllowAnyOrigin()
          .AllowAnyMethod()
          .AllowAnyHeader()
);

// 🔥 Ensure JSON response always
app.Use(async (context, next) =>
{
    context.Response.ContentType = "application/json";
    await next();
});

// ENV
var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";

var connStr = $"server={dbHost};port={dbPort};user={dbUser};password={dbPassword};database={dbName}";


// ✅ HEALTH
app.MapGet("/health", () =>
{
    return Results.Json(new { status = "healthy-dotnet" });
});


// ✅ GET TODOS
app.MapGet("/todos", () =>
{
    try
    {
        var list = new List<object>();

        using var conn = new MySqlConnection(connStr);
        conn.Open();

        var cmd = new MySqlCommand("SELECT * FROM todos", conn);
        var reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            list.Add(new
            {
                id = Convert.ToInt32(reader["id"]),
                title = reader["title"].ToString(),
                completed = Convert.ToBoolean(reader["completed"])
            });
        }

        return Results.Json(list);
    }
    catch (Exception ex)
    {
        Console.WriteLine("GET ERROR: " + ex.Message);

        return Results.Json(new
        {
            error = "GET_FAILED",
            message = ex.Message
        }, statusCode: 500);
    }
});


// ✅ POST TODOS (SAFE VERSION)
app.MapPost("/todos", async (HttpContext context) =>
{
    try
    {
        var body = await new StreamReader(context.Request.Body).ReadToEndAsync();

        if (string.IsNullOrEmpty(body))
        {
            return Results.Json(new { error = "Empty body" }, statusCode: 400);
        }

        var todo = JsonSerializer.Deserialize<Todo>(body);

        if (todo == null)
        {
            return Results.Json(new { error = "Invalid JSON" }, statusCode: 400);
        }

        using var conn = new MySqlConnection(connStr);
        conn.Open();

        var cmd = new MySqlCommand(
            "INSERT INTO todos (title, completed) VALUES (@title, @completed)",
            conn
        );

        cmd.Parameters.AddWithValue("@title", todo.title);
        cmd.Parameters.AddWithValue("@completed", todo.completed);

        cmd.ExecuteNonQuery();

        return Results.Json(new { message = "Todo added (.NET)" });
    }
    catch (Exception ex)
    {
        Console.WriteLine("POST ERROR: " + ex.Message);

        return Results.Json(new
        {
            error = "POST_FAILED",
            message = ex.Message
        }, statusCode: 500);
    }
});

app.Run();

record Todo(string title, bool completed);