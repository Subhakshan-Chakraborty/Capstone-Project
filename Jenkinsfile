pipeline {
    agent any

    environment {
        PROJECT_ID      = "linux-box-1-492217"
        REGION          = "asia-south1"
        REGISTRY        = "asia-south1-docker.pkg.dev/linux-box-1-492217/capstone-registry"
        ZONE            = "asia-south1-b"
        BACKEND_VM      = "backend-vm"
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
                    docker build --no-cache -t capstone-pipeline-django   ./backend/django
                    docker build --no-cache -t capstone-pipeline-node     ./backend/node
                    docker build --no-cache -t capstone-pipeline-dotnet   ./backend/dotnet
                '''
            }
        }

        stage('Push to Artifact Registry') {
            steps {
                sh '''
                    gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet

                    # Tag with build number only (no more :latest push)
                    docker tag capstone-pipeline-fastapi $REGISTRY/fastapi:$BUILD_NUMBER
                    docker tag capstone-pipeline-django   $REGISTRY/django:$BUILD_NUMBER
                    docker tag capstone-pipeline-node     $REGISTRY/node:$BUILD_NUMBER
                    docker tag capstone-pipeline-dotnet   $REGISTRY/dotnet:$BUILD_NUMBER

                    docker push $REGISTRY/fastapi:$BUILD_NUMBER
                    docker push $REGISTRY/django:$BUILD_NUMBER
                    docker push $REGISTRY/node:$BUILD_NUMBER
                    docker push $REGISTRY/dotnet:$BUILD_NUMBER

                    echo "✅ Pushed all images with build number: $BUILD_NUMBER"
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
                            git fetch origin && git reset --hard origin/main &&

                            echo '🔢 Updating docker-compose.yml to build number: ${BUILD_NUMBER}' &&
                            sed -i 's|/fastapi:[0-9]*|/fastapi:${BUILD_NUMBER}|g' docker-compose.yml &&
                            sed -i 's|/django:[0-9]*|/django:${BUILD_NUMBER}|g'   docker-compose.yml &&
                            sed -i 's|/node:[0-9]*|/node:${BUILD_NUMBER}|g'       docker-compose.yml &&
                            sed -i 's|/dotnet:[0-9]*|/dotnet:${BUILD_NUMBER}|g'   docker-compose.yml &&

                            echo 'docker-compose.yml now uses:' &&
                            grep 'image:' docker-compose.yml &&

                            gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet &&
                            docker compose pull &&
                            bash /home/subhakshanchakraborty8/fetch-secrets.sh &&
                            docker compose restart nginx
                        "
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for services to start..."
                    sleep 30
                    curl -f http://34.95.108.50/api/health
                    echo "Build #${BUILD_NUMBER} deployed successfully!"
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! Build #${BUILD_NUMBER} deployed."
        }
        failure {
            echo "Pipeline failed! Build #${BUILD_NUMBER} was NOT deployed."
        }
    }
}