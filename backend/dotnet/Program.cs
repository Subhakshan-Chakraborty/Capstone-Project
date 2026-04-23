using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);

// 🔥 IMPORTANT: Bind to Docker port
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8003);
});

var app = builder.Build();

// Env variables
var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";

var connectionString = $"server={dbHost};port={dbPort};user={dbUser};password={dbPassword};database={dbName}";

// Health check
app.MapGet("/health", () => Results.Json(new { status = "healthy-dotnet" }));

// GET todos
app.MapGet("/todos", () =>
{
    try
    {
        var todos = new List<object>();

        using (var conn = new MySqlConnection(connectionString))
        {
            conn.Open();
            var cmd = new MySqlCommand("SELECT * FROM todos", conn);
            var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                todos.Add(new
                {
                    id = reader["id"],
                    title = reader["title"],
                    completed = reader["completed"]
                });
            }
        }

        return Results.Json(todos);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// POST todo
app.MapPost("/todos", (Todo todo) =>
{
    try
    {
        using (var conn = new MySqlConnection(connectionString))
        {
            conn.Open();
            var cmd = new MySqlCommand(
                "INSERT INTO todos (title, completed) VALUES (@title, @completed)", conn
            );
            cmd.Parameters.AddWithValue("@title", todo.title);
            cmd.Parameters.AddWithValue("@completed", todo.completed);
            cmd.ExecuteNonQuery();
        }

        return Results.Json(new { message = "Todo added (.NET)" });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.Run();

record Todo(string title, bool completed);