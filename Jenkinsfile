pipeline {
    agent any

    environment {
        PROJECT_ID = "linux-box-1-492217"
        REGION = "asia-south1"
        REGISTRY = "asia-south1-docker.pkg.dev/linux-box-1-492217/capstone-registry"
        ZONE = "asia-south1-b"
        BACKEND_VM = "backend-vm"
        FRONTEND_BUCKET = "capstone-frontend-bucket0"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    docker build --no-cache -t capstone-pipeline-fastapi ./backend/fast-api
                    docker build --no-cache -t capstone-pipeline-django ./backend/django
                    docker build --no-cache -t capstone-pipeline-node ./backend/node
                    docker build --no-cache -t capstone-pipeline-dotnet ./backend/dotnet
                '''
            }
        }

        stage('Push to Artifact Registry') {
            steps {
                sh '''
                    gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet

                    docker tag capstone-pipeline-fastapi $REGISTRY/fastapi:latest
                    docker tag capstone-pipeline-fastapi $REGISTRY/fastapi:$BUILD_NUMBER
                    
                    docker tag capstone-pipeline-django $REGISTRY/django:latest
                    docker tag capstone-pipeline-django $REGISTRY/django:$BUILD_NUMBER
                    
                    docker tag capstone-pipeline-node $REGISTRY/node:latest
                    docker tag capstone-pipeline-node $REGISTRY/node:$BUILD_NUMBER
                    
                    docker tag capstone-pipeline-dotnet $REGISTRY/dotnet:latest
                    docker tag capstone-pipeline-dotnet $REGISTRY/dotnet:$BUILD_NUMBER

                    docker push $REGISTRY/fastapi:latest
                    docker push $REGISTRY/fastapi:$BUILD_NUMBER
                    
                    docker push $REGISTRY/django:latest
                    docker push $REGISTRY/django:$BUILD_NUMBER
                    
                    docker push $REGISTRY/node:latest
                    docker push $REGISTRY/node:$BUILD_NUMBER
                    
                    docker push $REGISTRY/dotnet:latest
                    docker push $REGISTRY/dotnet:$BUILD_NUMBER
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    cd frontend
                    npm install
                    CI=false npm run build
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                    gsutil -m rsync -r -d frontend/build/ gs://$FRONTEND_BUCKET/
                '''
            }
        }

        stage('Deploy to backend-vm') {
            steps {
                sh '''
                    gcloud compute ssh $BACKEND_VM \
                        --zone=$ZONE \
                        --tunnel-through-iap \
                        --quiet \
                        --command="
                            cd /home/subhakshanchakraborty8/Capstone-Project &&
                            git fetch origin &&
                            git reset --hard origin/main &&
                            gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet &&
                            docker compose pull &&
                            docker compose up -d &&
                            docker compose restart nginx
                        "
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for services..."
                    sleep 30
                    curl -f http://34.95.108.50/api/health
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! App deployed successfully."
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}