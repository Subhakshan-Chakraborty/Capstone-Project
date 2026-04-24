pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "capstone-ci"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Env') {
            steps {
                sh '''
                cat <<EOF > .env
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=root123
DB_NAME=todo_db
DB_PORT=3306
EOF
                '''
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Run') {
            steps {
                sh 'docker compose up -d'
            }
        }

        stage('Wait for Services') {
            steps {
                sh '''
                echo "Waiting for services to be ready..."

                for i in {1..10}; do
                  curl -s http://localhost/api/health && break
                  echo "Retry $i..."
                  sleep 5
                done
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                echo "Running health check..."
                curl -f http://localhost/api/health
                '''
            }
        }
    }

    post {
        always {
            echo "Cleaning up containers..."
            sh 'docker compose down'
        }

        success {
            echo "Pipeline succeeded"
        }

        failure {
            echo "Pipeline failed"
            sh 'docker compose logs'
        }
    }
}