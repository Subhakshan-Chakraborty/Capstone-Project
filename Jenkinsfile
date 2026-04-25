pipeline {
    agent any

    environment {
        BACKEND_IP = "10.0.0.2"
    }

    stages {

        stage('Deploy to Backend VM') {
            steps {
                sshagent(['backend-key']) {
                    sh '''
ssh -o StrictHostKeyChecking=no subhakshanchakraborty8@$BACKEND_IP <<EOF
cd ~/Capstone-Project || git clone https://github.com/Subhakshan-Chakraborty/Capstone-Project.git ~/Capstone-Project
cd ~/Capstone-Project
git pull

docker compose down
docker compose up -d --build
EOF
'''
                }
            }
        }

        stage('Verify') {
            steps {
                sshagent(['backend-key']) {
                    sh '''
ssh -o StrictHostKeyChecking=no subhakshanchakraborty8@$BACKEND_IP <<EOF
curl -f http://localhost/api/todos
EOF
'''
                }
            }
        }
    }
}