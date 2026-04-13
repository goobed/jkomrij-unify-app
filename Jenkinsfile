pipeline {
  agent {
    kubernetes {
      yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: go
    image: golang:1.25
    command: ['cat']
    tty: true
    workingDir: /home/jenkins/agent
  - name: node
    image: node:20-alpine
    command: ['cat']
    tty: true
    workingDir: /home/jenkins/agent
  - name: trivy
    image: aquasec/trivy:latest
    command: ['cat']
    tty: true
    workingDir: /home/jenkins/agent
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: ['/busybox/cat']
    tty: true
    workingDir: /home/jenkins/agent
  restartPolicy: Never
"""
    }
  }

  parameters {
    string(name: 'DOCKER_NAMESPACE', defaultValue: 'zstace1', description: 'Docker Hub namespace (e.g. org or username)')
    string(name: 'IMAGE_TAG', defaultValue: '1.0.0', description: 'Image tag to publish')
    string(name: 'VITE_API_BASE_URL', defaultValue: '', description: 'Optional API base URL for the frontend build')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build backend') {
      steps {
        container('go') {
          sh 'cd backend && go mod download && go build -buildvcs=false -o bin/themepark-api'
        }
      }
    }

    stage('Build frontend') {
      steps {
        container('node') {
          sh 'cd frontend && npm ci && npm run build'
        }
      }
    }

    stage('Security scans') {
      steps {
        container('go') {
          sh '''
            set -e
            export PATH="$PATH:/go/bin"

            # 1. Run GoSec from inside backend, but output to root
            cd backend
            go install github.com/securego/gosec/v2/cmd/gosec@latest
            gosec -fmt sarif -out ../gosec.sarif ./... || true
            cd ..

            # 2. Run Gitleaks in the root
            go install github.com/zricethezav/gitleaks/v8@latest
            gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif --exit-code 0 || true

            # 3. Create the empty fallback file in the root
            if [ ! -f "gitleaks.sarif" ]; then
              echo '{"version": "2.1.0", "runs": [{"tool": {"driver": {"name": "gitleaks"}}, "results": []}]}' > gitleaks.sarif
            fi
          '''
        }
        container('trivy') {
          sh '''
            set -e
            mkdir -p /tmp/trivy

            # 4. Run Trivy in the root
            TRIVY_CACHE_DIR=/tmp/trivy trivy fs --scanners vuln --format sarif \
              --output trivy.sarif . \
              --exit-code 0
          '''
        }
        registerSecurityScan(
          artifacts: "*.sarif",
          format: "sarif",
          archive: true
        )
      }
    }

    stage('Build and push images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_TOKEN')]) {
          container('kaniko') {
            sh '''
              mkdir -p /kaniko/.docker
              AUTH="$(echo -n "$DOCKERHUB_USERNAME:$DOCKERHUB_TOKEN" | base64)"

              # Using echo avoids the EOF indentation trap entirely
              echo "{\\"auths\\":{\\"https://index.docker.io/v1/\\":{\\"auth\\":\\"${AUTH}\\"}}}" > /kaniko/.docker/config.json

              /kaniko/executor --context dir://$(pwd)/backend \
                --dockerfile backend/Dockerfile \
                --destination ${DOCKER_NAMESPACE}/theme-park-backend:${IMAGE_TAG}

              /kaniko/executor --context dir://$(pwd)/frontend \
                --dockerfile frontend/Dockerfile \
                --destination ${DOCKER_NAMESPACE}/theme-park-frontend:${IMAGE_TAG} \
                --build-arg VITE_API_BASE_URL=${VITE_API_BASE_URL}
            '''
          }
        }
      }
    }
  }
}
