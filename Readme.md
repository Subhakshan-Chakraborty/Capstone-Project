# 🚀 3-Tier Multi-Backend DevOps Project

## 📌 Overview
This project demonstrates a production-like **3-tier architecture** with:
- One frontend (React)
- Multiple backend services (FastAPI, Django, Node.js, .NET)
- Shared MySQL database

---

## 🧱 Architecture

Frontend (React)
↓
Backend Services
- FastAPI (8000)
- Django (8001)
- Node.js (8002)
- .NET (5000/auto)
↓
MySQL Database (Docker)

---

## 🛠️ Tech Stack

- Frontend: React  
- Backend:
  - FastAPI (Python)
  - Django (Python)
  - Node.js (Express)
  - .NET Web API  
- Database: MySQL (Docker)

---

## 📁 Project Structure


Capstone_Project/
│
├── frontend/
│
├── backend/
│ ├── fastapi/
│ ├── django/
│ ├── node/
│ └── dotnet/
│
└── README.md


---

## 🚀 Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd Capstone_Project
🐳 MySQL Setup (Docker)
docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=todo_db \
  -p 3306:3306 \
  mysql:8
🧠 Database Setup

Enter MySQL:

docker exec -it mysql-db mysql -u root -p

Password:

root123

Then run:

USE todo_db;

CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    completed BOOLEAN
);
⚡ FastAPI Setup
cd backend/fastapi

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload

Runs on:

http://127.0.0.1:8000
🌐 Django Setup
cd backend/django

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate

python manage.py runserver 8001

Runs on:

http://127.0.0.1:8001
🟢 Node.js Setup
cd backend/node

npm install
node index.js

Runs on:

http://localhost:8002
🔵 .NET Setup
cd backend/dotnet

dotnet run

Runs on:

http://localhost:5000
(or auto-assigned port)
💻 Frontend Setup
cd frontend

npm install
npm start

Runs on:

http://localhost:3000
🔍 API Endpoints
Health Checks
FastAPI → /health
Django → /health
Node.js → /health
.NET → /health
Todos
GET /todos
POST /todos
🔥 Current Status
✅ Multi-backend services working
✅ Shared MySQL database
✅ Frontend connected (FastAPI)
✅ All services independently tested
🚧 Upcoming Features
Dockerization
Nginx reverse proxy
Jenkins CI/CD pipeline
Artifact Registry integration
Cloud deployment (AWS & GCP)
👨‍💻 Author

Subhakshan Chakraborty


---

Now this will:
- ✅ Render perfectly on GitHub  
- ✅ No formatting issues  
- ✅ Clean professional look  

---

Once done, push and tell me:

👉 **“pushed to github”**

Tomorrow we go:
🔥 Docker → Jenkins → Full DevOps pipeline