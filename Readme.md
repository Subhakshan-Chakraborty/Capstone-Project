# 🚀 Capstone Project — Full Stack GCP Deployment

A multi-backend Todo application deployed on **Google Cloud Platform** with:
- **4 Backend services** (FastAPI, Django, Node.js, .NET) behind Nginx
- **React Frontend** served via Cloud Storage + CDN
- **Cloud SQL** (MySQL 8.4) as managed database
- **Jenkins CI/CD** pipeline with Artifact Registry
- **Secure networking** with VPC, private/public subnets, Cloud NAT

---

## 📐 Architecture

```
User
 │
 ├──[HTTP]──► Frontend LB (34.54.234.127)
 │                  │
 │            Cloud CDN + Cloud Storage
 │              (React Build Files)
 │
 └──[API]───► Backend LB (34.95.108.50)
                    │
               Nginx (port 80)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼           ▼
   FastAPI:8000  Django:8001  Node:8002  .NET:8003
        │           │           │           │
        └───────────┴───────────┴───────────┘
                        │
                   Cloud SQL (MySQL 8.4)
                   Private IP: 10.134.160.3

CI/CD:
Developer → git push → GitHub → Webhook → Jenkins VM
                                               │
                                    Build Docker Images
                                               │
                                    Push to Artifact Registry
                                               │
                                    backend-vm pulls & restarts
```

---

## 📋 Prerequisites

### Local Machine
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- [Node.js](https://nodejs.org/) (v18+) installed
- [Git](https://git-scm.com/) installed
- GCP account with billing enabled

### GCP Requirements
- Project created (note your **Project ID**)
- APIs enabled:
  - Compute Engine API
  - Cloud SQL Admin API
  - Artifact Registry API
  - Cloud Storage API
  - Identity-Aware Proxy API

---

## 🌐 Phase 1 — VPC & Networking

### Step 1: Create VPC
```
GCP Console → VPC Network → Create VPC
  Name: capstone-vpc
  Mode: Custom
```

### Step 2: Create Subnets
```
Public Subnet:
  Name: public-subnet
  Region: asia-south1
  CIDR: 10.0.1.0/24

Private Subnet:
  Name: private-subnet
  Region: asia-south1
  CIDR: 10.0.2.0/24
```

### Step 3: Create Firewall Rules
```
Rule 1 — HTTP:
  Name: allow-http
  Direction: Ingress
  Source: 0.0.0.0/0
  Port: tcp:80

Rule 2 — Internal:
  Name: allow-internal
  Direction: Ingress
  Source: 10.0.0.0/16
  Ports: all tcp

Rule 3 — SSH:
  Name: allow-ssh
  Direction: Ingress
  Source: 0.0.0.0/0
  Port: tcp:22

Rule 4 — IAP SSH (for private VM):
  Name: allow-iap
  Direction: Ingress
  Source: 35.235.240.0/20
  Port: tcp:22
```

> ⚠️ **Note:** GCP does not have native public/private subnet concepts like AWS. "Private" means the VM has no external IP. "Public" means the VM has an external IP.

---

## 🌐 Phase 2 — Cloud NAT

Cloud NAT allows the private backend-vm to reach the internet (to pull Docker images, install packages) without having a public IP.

```
GCP Console → Network Services → Cloud NAT → Create
  Name: capstone-nat
  VPC: capstone-vpc
  Region: asia-south1
  Cloud Router: Create new → capstone-router
  NAT mapping: All subnets
  IP Allocation: Automatic
```

---

## 🖥️ Phase 3 — Create VMs

### backend-vm (Private)
```
GCP Console → Compute Engine → VM Instances → Create
  Name: backend-vm
  Region: asia-south1-a
  Machine: e2-medium
  Disk: 50 GB
  Network: capstone-vpc
  Subnet: private-subnet
  External IP: None ← IMPORTANT
```

### jenkins-vm (Public)
```
GCP Console → Compute Engine → VM Instances → Create
  Name: jenkins-vm
  Region: asia-south1-a
  Machine: e2-medium
  Disk: 50 GB
  Network: capstone-vpc
  Subnet: public-subnet
  External IP: Ephemeral
```

### SSH into backend-vm
Since backend-vm has no external IP, use IAP tunnel:
```bash
gcloud compute ssh backend-vm --zone=asia-south1-a --tunnel-through-iap
```

> ⚠️ **Bug:** If you get `gcloud: command not found` on Windows, install Google Cloud SDK and restart your terminal.

> ⚠️ **Bug:** If you get `insufficient authentication scopes` when running gcloud from inside the VM, run the command from your local machine instead.

---

## 🐳 Phase 3 (continued) — Docker Setup on backend-vm

SSH into backend-vm and run:

```bash
# Install Docker
sudo apt update
sudo apt install -y docker.io git
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Clone the Project
```bash
git clone https://github.com/Subhakshan-Chakraborty/Capstone-Project.git
cd Capstone-Project
```

### Create .env file
```bash
nano .env
```

Add (update values after Cloud SQL is set up):
```
DB_HOST=<CLOUD_SQL_PRIVATE_IP>
DB_USER=appuser
DB_PASSWORD=App@12345
DB_NAME=todo_db
DB_PORT=3306
```

### Run Containers
```bash
docker compose up -d --build
```

Expected output — all containers healthy:
```
✔ Container mysql-db      Healthy
✔ Container fastapi-app   Started
✔ Container django-app    Started
✔ Container node-app      Started
✔ Container dotnet-app    Started
✔ Container nginx         Started
```

> ⚠️ **Bug:** `unknown shorthand flag: 'd' in -d` — Docker Compose not installed. Install it using the curl command above.

### Verify
```bash
curl http://localhost/api/health
# Should return: {"status":"healthy"}
```

---

## ⚖️ Phase 4 — Cloud Load Balancer (Backend)

### Step 1: Create Instance Group
```
GCP Console → Compute Engine → Instance Groups → Create
  Type: Unmanaged
  Name: backend-group
  Zone: asia-south1-a
  Add VM: backend-vm
```

> ℹ️ No instance template needed for unmanaged groups.

### Step 2: Create Health Check
```
GCP Console → Network Services → Health Checks → Create
  Name: backend-health
  Protocol: HTTP
  Port: 80
  Request path: /api/health
```

### Step 3: Create Load Balancer
```
GCP Console → Network Services → Load Balancing → Create
  Type: Application Load Balancer (HTTP/HTTPS)
  Facing: Public (External)
  Scope: Global

Frontend:
  Protocol: HTTP
  Port: 80
  IP: Ephemeral

Backend Service:
  Add instance group: backend-group
  Port: 80
  Health check: backend-health

URL Map: Default → backend service
```

### Verify
```bash
curl http://<LOAD_BALANCER_IP>/api/health
# Should round-robin across all 4 backends
```

---

## 🗄️ Phase 6 — Cloud SQL

### Step 1: Create Cloud SQL Instance
```
GCP Console → Cloud SQL → Create Instance
  Database: MySQL 8.4
  Instance ID: todo-mysql-db
  Password: (set strong password)
  Region: asia-south1

Connections:
  ✅ Enable Private IP
  VPC: capstone-vpc
  ❌ Disable Public IP
```

> ⚠️ **Important:** Must enable Private IP and attach to capstone-vpc before creating.

### Step 2: Create Database & User

Wait for instance to be ready, then go to:
```
Cloud SQL → todo-mysql-db → Databases → Create
  Name: todo_db

Cloud SQL → todo-mysql-db → Users → Add User
  Username: appuser
  Host: % (any host)
  Password: App@12345
```

### Step 3: Set Password via SQL (Important!)

The GCP Console sometimes doesn't save passwords correctly. Set it directly:

```bash
# From backend-vm
docker run --rm mysql:8 mysql -h <CLOUD_SQL_PRIVATE_IP> -u root -p<ROOT_PASSWORD> \
  -e "ALTER USER 'appuser'@'%' IDENTIFIED BY 'App@12345';"
```

### Step 4: Initialize Database

```bash
docker run --rm mysql:8 mysql -h <CLOUD_SQL_PRIVATE_IP> -u appuser -pApp@12345 \
  -e "USE todo_db; SOURCE /path/to/init.sql;"
```

Or manually:
```bash
docker run --rm mysql:8 mysql -h <CLOUD_SQL_PRIVATE_IP> -u appuser -pApp@12345 todo_db \
  -e "CREATE TABLE IF NOT EXISTS todos (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), completed BOOLEAN DEFAULT FALSE);"
```

### Step 5: Update docker-compose.yml

Remove the mysql service entirely. Your compose file should only have:
`fastapi`, `django`, `node`, `dotnet`, `nginx`

Update `.env`:
```
DB_HOST=<CLOUD_SQL_PRIVATE_IP>
DB_USER=appuser
DB_PASSWORD=App@12345
DB_NAME=todo_db
DB_PORT=3306
```

### Step 6: SSL Fix for Node.js

> ⚠️ **Critical Bug:** Cloud SQL MySQL 8.4 uses `caching_sha2_password` and **enforces SSL**. The `mysql2` npm package needs SSL explicitly enabled.

In `backend/node/index.js`, add `ssl` to the connection:

```javascript
db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }  // ← ADD THIS
});
```

**Why this is needed:**
- Cloud SQL MySQL 8.4 dropped `mysql_native_password`
- It uses `caching_sha2_password` by default
- Connections without SSL are rejected even if credentials are correct
- The error looks like: `Access denied for user 'appuser'@'10.0.0.6' (using password: YES)`

> ⚠️ **Note:** Same SSL fix may be needed for FastAPI, Django, and .NET backends depending on their MySQL client versions.

### Step 7: Restart Containers
```bash
docker compose down
docker compose up -d --build
```

### Verify
```bash
docker logs node-app
# Should show: ✅ Connected to MySQL (Node)
```

---

## 🌍 Phase 5 — Frontend (Cloud Storage + CDN)

### Step 1: Update API URL

In `frontend/src/app.js`, change:
```javascript
const API = "http://<BACKEND_LOAD_BALANCER_IP>/api";
```

### Step 2: Build React App (on your local machine)
```bash
cd frontend
npm install
npm run build
```

> ⚠️ Do NOT add `homepage` to `package.json` if you're using a Load Balancer — it breaks the asset paths.

### Step 3: Create Cloud Storage Bucket
```
GCP Console → Cloud Storage → Create Bucket
  Name: capstone-frontend-bucket0 (must be globally unique)
  Region: asia-south1
  Storage class: Standard
  Access control: Fine-grained
  ❌ Uncheck "Enforce public access prevention"
```

### Step 4: Make Bucket Public
```
Cloud Storage → capstone-frontend-bucket0 → Permissions → Grant Access
  New principals: allUsers
  Role: Storage Object Viewer
```

### Step 5: Configure Website
```
Cloud Storage → capstone-frontend-bucket0 → Configuration → Edit website
  Index page: index.html
  Error page: index.html
```

### Step 6: Upload Build Files

Upload in two steps:
1. Select all files in `frontend/build/` root → **Upload files**
2. Select `frontend/build/static/` folder → **Upload folder**

> ⚠️ **Bug:** If you only upload root files, the static/ folder (JS/CSS) is missing and the page loads blank.

### Step 7: Create Frontend Load Balancer with CDN
```
GCP Console → Network Services → Load Balancing → Create
  Type: Application Load Balancer (HTTP/HTTPS)
  Facing: Public (External)
  Scope: Global

Frontend:
  Protocol: HTTP
  Port: 80
  IP: Ephemeral

Backend:
  Create Backend Bucket:
    Name: frontend-backend-bucket
    Cloud Storage bucket: capstone-frontend-bucket0
    ✅ Enable Cloud CDN
```

> ℹ️ Cloud CDN is enabled as a feature of the Load Balancer backend, not as a separate service.

### Verify

Access `http://<FRONTEND_LB_IP>` in your browser. The To-Do app should load.

> ⚠️ **Bug:** If you access via `https://storage.googleapis.com/...`, the browser forces HTTPS and blocks HTTP API calls (Mixed Content error). Always use the Load Balancer IP instead.

---

## ⚙️ Phase 7 — Jenkins CI/CD

### Step 1: SSH into jenkins-vm
```bash
gcloud compute ssh jenkins-vm --zone=asia-south1-a
```

### Step 2: Install Docker & Jenkins
```bash
sudo apt update
sudo apt install -y docker.io

# Install Jenkins
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Add jenkins user to docker group
sudo usermod -aG docker jenkins
```

### Step 3: Access Jenkins
```
http://<JENKINS_VM_EXTERNAL_IP>:8080
```

Get initial password:
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Step 4: Create Artifact Registry
```
GCP Console → Artifact Registry → Create Repository
  Name: capstone-registry
  Format: Docker
  Region: asia-south1
```

### Step 5: Configure Jenkins Pipeline

Create a `Jenkinsfile` in your repo root:
```groovy
pipeline {
  agent any
  environment {
    REGION = "asia-south1"
    PROJECT_ID = "<YOUR_GCP_PROJECT_ID>"
    REGISTRY = "asia-south1-docker.pkg.dev/<PROJECT_ID>/capstone-registry"
  }
  stages {
    stage('Build Images') {
      steps {
        sh "docker compose build"
      }
    }
    stage('Push to Artifact Registry') {
      steps {
        sh "gcloud auth configure-docker asia-south1-docker.pkg.dev"
        sh "docker tag capstone-project-fastapi ${REGISTRY}/fastapi:latest"
        sh "docker tag capstone-project-django ${REGISTRY}/django:latest"
        sh "docker tag capstone-project-node ${REGISTRY}/node:latest"
        sh "docker tag capstone-project-dotnet ${REGISTRY}/dotnet:latest"
        sh "docker push ${REGISTRY}/fastapi:latest"
        sh "docker push ${REGISTRY}/django:latest"
        sh "docker push ${REGISTRY}/node:latest"
        sh "docker push ${REGISTRY}/dotnet:latest"
      }
    }
    stage('Deploy to backend-vm') {
      steps {
        sh """
          gcloud compute ssh backend-vm --zone=asia-south1-a --tunnel-through-iap --command='
            cd ~/Capstone-Project &&
            docker compose pull &&
            docker compose up -d
          '
        """
      }
    }
  }
}
```

### Step 6: Configure GitHub Webhook
```
GitHub Repo → Settings → Webhooks → Add webhook
  Payload URL: http://<JENKINS_VM_IP>:8080/github-webhook/
  Content type: application/json
  Trigger: Just the push event
```

---

## 🐛 Complete Bugs & Fixes Reference

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | `gcloud` not recognized on Windows | Google Cloud SDK not installed | Install from cloud.google.com/sdk |
| 2 | SSH `insufficient authentication scopes` | Running gcloud SSH from inside VM | Run from local machine instead |
| 3 | `docker compose -d` flag error | Docker Compose not installed | Install Docker Compose separately |
| 4 | mysql-db container still running after compose down | Container started independently | `docker stop mysql-db && docker rm mysql-db` |
| 5 | `Access denied for appuser@10.0.0.6` | Cloud SQL enforces SSL, mysql2 not using SSL | Add `ssl: { rejectUnauthorized: false }` to connection |
| 6 | React app loads blank — 403 on JS/CSS | `static/` folder not uploaded to bucket | Upload `static/` folder separately |
| 7 | Wrong paths with bucket name in URL | `homepage` field in package.json | Remove `homepage` from package.json, rebuild |
| 8 | Mixed Content error (HTTPS → HTTP) | Browser forces HTTPS on storage.googleapis.com | Use Cloud CDN + HTTP Load Balancer for frontend |

---

## 📁 Project Structure

```
Capstone-Project/
├── frontend/               # React app
│   ├── src/
│   │   └── app.js         # Main app (update API URL here)
│   └── package.json
├── backend/
│   ├── fast-api/          # FastAPI service
│   ├── django/            # Django service
│   ├── node/              # Node.js service
│   │   └── index.js       # Add SSL fix here
│   └── dotnet/            # .NET service
├── nginx/
│   └── nginx.conf         # Nginx reverse proxy config
├── init.sql               # Database initialization
├── docker-compose.yml     # Container orchestration
├── .env                   # Environment variables (do not commit!)
└── Jenkinsfile            # CI/CD pipeline definition
```

---

## 🔑 Environment Variables (.env)

```
DB_HOST=<CLOUD_SQL_PRIVATE_IP>
DB_USER=appuser
DB_PASSWORD=<YOUR_PASSWORD>
DB_NAME=todo_db
DB_PORT=3306
```

> ⚠️ Never commit `.env` to GitHub. Add it to `.gitignore`.

---

## ✅ Quick Verification Checklist

```bash
# 1. All containers running
docker ps

# 2. Node connected to Cloud SQL
docker logs node-app | grep "Connected"

# 3. Health check via Load Balancer
curl http://<BACKEND_LB_IP>/api/health

# 4. Frontend accessible
curl http://<FRONTEND_LB_IP>
```

---

## 📌 Key IPs & URLs

| Resource | Value |
|----------|-------|
| Frontend Load Balancer | http://34.54.234.127 |
| Backend Load Balancer | http://34.95.108.50 |
| Cloud SQL Private IP | 10.134.160.3 |
| backend-vm Internal IP | 10.0.0.6 |
| Cloud Storage Bucket | capstone-frontend-bucket0 |

---


## Frontend Setup
### Step-1) cd frontend
### Step-2) Run 
``` 
npm create react app . 
```
### Step-3) Replace the entire frontend/src/App.js with this:
```
import { useEffect, useState } from "react";

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");

  const API = "http://34.95.108.50/api";

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
```
## 👤 Author

**Subhakshan Chakraborty**  
GitHub: [@Subhakshan-Chakraborty](https://github.com/Subhakshan-Chakraborty)
