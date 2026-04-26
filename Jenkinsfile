pipeline {
    agent any

    environment {
        PROJECT_ID = "linux-box-1-492217"
        REGION = "asia-south1"
        REGISTRY = "asia-south1-docker.pkg.dev/linux-box-1-492217/capstone-registry"
        ZONE = "asia-south1-a"
        BACKEND_VM = "backend-vm"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Push to Artifact Registry') {
            steps {
                sh '''
                    gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet

                    docker tag capstone-project-fastapi $REGISTRY/fastapi:latest
                    docker tag capstone-project-django $REGISTRY/django:latest
                    docker tag capstone-project-node $REGISTRY/node:latest
                    docker tag capstone-project-dotnet $REGISTRY/dotnet:latest

                    docker push $REGISTRY/fastapi:latest
                    docker push $REGISTRY/django:latest
                    docker push $REGISTRY/node:latest
                    docker push $REGISTRY/dotnet:latest
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
                            cd ~/Capstone-Project &&
                            gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet &&
                            docker compose pull &&
                            docker compose up -d
                        "
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for services..."
                    sleep 10
                    curl -f http://34.95.108.50/api/health
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline succeeded! App deployed successfully."
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}