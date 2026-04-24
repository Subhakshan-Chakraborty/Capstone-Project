# 🚀 Capstone Project – Multi-Backend 3-Tier Architecture

## 📌 Overview

This project demonstrates a **production-like 3-tier architecture** using multiple backend technologies:

- FastAPI (Python)
- Django (Python)
- Node.js (Express)
- .NET (ASP.NET Core)
- MySQL (shared database)
- NGINX (reverse proxy + load balancer)
- Docker & Docker Compose

All backend services share a **single MySQL database** and are routed through NGINX using **round-robin load balancing**.

---

## 🏗️ Architecture
Frontend (React)
↓
NGINX
↓
┌───────────────┬───────────────┬───
│ FastAPI │ Django │ Node.js │ .NET │
└───────────────┴───────────────┴───
↓
MySQL DB


---

## 📂 Project Structure
CAPSTONE-PROJECT/
│
├── backend/
│ ├── django/
│ ├── fast-api/
│ ├── node/
│ └── dotnet/
│
├── frontend/
├── nginx/
│ └── nginx.conf
│
├── docker-compose.yml
├── .env
├── init.sql
└── README.md


---

## ⚙️ Prerequisites

Make sure you have installed:

- Docker  
- Docker Compose  
- Git  

---

## 🔧 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd CAPSTONE-PROJECT

2️⃣ Create .env file

Create a .env file in root:

DB_HOST=mysql-db
DB_USER=root
DB_PASSWORD=root123
DB_NAME=todo_db
DB_PORT=3306
3️⃣ Start the Application
docker compose up --build -d
4️⃣ Verify Containers
docker ps

You should see:

mysql-db
fastapi-app
django-app
node-app
dotnet-app
nginx
🌐 Access the Application
🔹 API via NGINX
http://localhost/api/todos
🔹 Health Check (Optional)
http://localhost/api/health
🔄 Load Balancing Behavior

NGINX distributes requests across all backend services:

FastAPI
Django
Node.js
.NET

Each request may be served by a different backend.

🧪 Testing Load Balancing

Run:

for i in {1..10}; do curl http://localhost/api/todos; done

Check logs:

docker logs -f nginx

You will see different backends serving requests.

🐞 Debugging
Check logs:
docker logs -f nginx
docker logs -f fastapi-app
docker logs -f django-app
docker logs -f node-app
docker logs -f dotnet-app
Restart everything:
docker compose down
docker compose up --build -d
⚠️ Common Issues
1. Port already in use
Error: port already allocated

Fix:

docker compose down
2. MySQL connection issue

Wait for MySQL to be healthy:

docker ps
3. No response from API

Check:

NGINX config
Backend logs
📌 Notes
All backend services use the same database
APIs are unified (/todos, /health)
Frontend communicates only with NGINX
🚀 Future Improvements
Deploy to GCP (VPC, Load Balancer, Cloud SQL)
CI/CD with Jenkins
Monitoring (Prometheus + Grafana)
Kubernetes (GKE)
👨‍💻 Author

Capstone DevOps Project


If you want next-level polish, I can :contentReference[oaicite:0]{index=0}.




## frontend/src/app.js code:
import { useEffect, useState } from "react";

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");

  const API = "http://localhost/api";

  // Fetch todos
  const fetchTodos = async () => {
    const res = await fetch(`${API}/todos`);
    const data = await res.json();
    setTodos(data);
  };

  // Add todo
  const addTodo = async () => {
    if (!title) return;

    await fetch(`${API}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, completed: false })
    });

    setTitle("");
    fetchTodos();
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>To-Do App</h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task"
      />
      <button onClick={addTodo}>Add</button>

      <ul>
        {todos.map((t, i) => (
          <li key={i}>
            {t.title} - {t.completed ? "Done" : "Pending"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;