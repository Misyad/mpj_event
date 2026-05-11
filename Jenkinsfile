pipeline {
    agent any

    environment {
        APP_NAME = "mpj-event-app"
        API_NAME = "mpj-event-api"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    echo "Building and deploying with Docker Compose..."
                    sh '''
                        set -e

                        if docker compose version >/dev/null 2>&1; then
                            COMPOSE="docker compose"
                        elif command -v docker-compose >/dev/null 2>&1; then
                            COMPOSE="docker-compose"
                        else
                            echo "Docker Compose is not installed on this Jenkins server."
                            exit 1
                        fi

                        docker rm -f "$APP_NAME" >/dev/null 2>&1 || true
                        docker rm -f "$API_NAME" >/dev/null 2>&1 || true
                        $COMPOSE up -d --build --remove-orphans
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Deployment success."
        }
        failure {
            echo "Deployment failed. Check Jenkins logs."
        }
    }
}
