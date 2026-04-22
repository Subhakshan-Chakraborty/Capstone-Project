from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB connection function
def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="root123",
        database="todo_db"
    )

# Model
class Todo(BaseModel):
    title: str
    completed: bool = False

# Health check
@app.get("/health")
def health():
    return {"status": "healthy"}

# Get all todos
@app.get("/todos")
def get_todos():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM todos")
    result = cursor.fetchall()

    conn.close()
    return result

# Add todo
@app.post("/todos")
def add_todo(todo: Todo):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "INSERT INTO todos (title, completed) VALUES (%s, %s)"
    cursor.execute(query, (todo.title, todo.completed))

    conn.commit()
    conn.close()

    return {"message": "Todo added"}

# Update todo
@app.put("/todos/{id}")
def update_todo(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "UPDATE todos SET completed = TRUE WHERE id = %s"
    cursor.execute(query, (id,))

    conn.commit()
    conn.close()

    return {"message": "Todo updated"}