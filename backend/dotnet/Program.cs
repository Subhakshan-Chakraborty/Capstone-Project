using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Health check
app.MapGet("/health", () => Results.Json(new { status = "healthy-dotnet" }));

// Get todos
app.MapGet("/todos", () =>
{
    var todos = new List<object>();

    using (var conn = new MySqlConnection("server=localhost;user=root;password=root123;database=todo_db"))
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
});

// Add todo
app.MapPost("/todos", (Todo todo) =>
{
    using (var conn = new MySqlConnection("server=localhost;user=root;password=root123;database=todo_db"))
    {
        conn.Open();
        var cmd = new MySqlCommand("INSERT INTO todos (title, completed) VALUES (@title, @completed)", conn);
        cmd.Parameters.AddWithValue("@title", todo.title);
        cmd.Parameters.AddWithValue("@completed", todo.completed);
        cmd.ExecuteNonQuery();
    }

    return Results.Json(new { message = "Todo added (.NET)" });
});

app.Run();

record Todo(string title, bool completed);