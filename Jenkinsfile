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
                sshagent(['subhakshanchakraborty8']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no subhakshanchakraborty8@10.0.0.2 << 'EOF'
                    
                    echo "Waiting for services to be ready..."
                    sleep 40

                    echo "Starting health check..."

                    for i in {1..6}; do
                    if curl -f http://localhost; then
                        echo "Application is UP "
                        exit 0
                    else
                        echo "Attempt $i failed... retrying in 10s"
                        sleep 10
                    fi
                    done

                    echo "Application is DOWN "
                    exit 1

                    EOF
                    '''
                }
            }
        }
    }
}