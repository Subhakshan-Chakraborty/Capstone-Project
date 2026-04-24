pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
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

        stage('Test') {
            steps {
                sh '''
                sleep 15
                curl -f http://localhost/api/health
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker compose down'
            }
        }
    }
}