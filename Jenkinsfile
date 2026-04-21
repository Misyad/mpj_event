pipeline {
    agent any

    environment {
        // Ganti dengan registry & nama image Anda
        DOCKER_IMAGE = "registry.gitlab.com/alifhamdanrifai/mpj-event"
        APP_NAME = "mpj-event-app"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Next.js') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    // Perlu login ke docker registry dahulu di Jenkins Global Credentials
                    sh "docker build -t ${DOCKER_IMAGE}:latest ."
                    // sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                script {
                    /*
                    // Contoh Deployment via SSH ke VPS
                    sshagent(['vps-ssh-key-id']) {
                        sh "ssh -o StrictHostKeyChecking=no user@server-ip 'cd /app && docker-compose pull && docker-compose up -d'"
                    }
                    */
                    echo "Deploy stage ready. Configure SSH shared keys in Jenkins to enable automatic deployment."
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline success! Application is built and ready."
        }
        failure {
            echo "Pipeline failed. Check Jenkins logs."
        }
    }
}
