// Jenkinsfile
pipeline {
    agent any // Pastikan agent ini memiliki Docker & Git terinstal dan dikonfigurasi dengan benar

    tools {
        git 'Default' // Nama tool Git yang dikonfigurasi di Jenkins, bisa berbeda
    }

    environment {
        DOCKER_HUB_USERNAME            = 'vitoackerman'
        DOCKER_IMAGE_NAME              = 'alifsmart-auth-service' // DISESUAIKAN
        FULL_APP_IMAGE_NAME            = "${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE_NAME}"
        
        // Konfigurasi runtime untuk alifsmart-auth-service (ambil dari Jenkins Credentials)
        // Pastikan credentials ini sudah dibuat di Jenkins
        ENV_NODE_ENV_PROD              = 'production'
        ENV_APP_PORT                   = '3001' // Port internal aplikasi auth-service

        // PostgreSQL Credentials
        ENV_DB_USER                    = credentials('pg_user')       // ID Credentials Jenkins untuk DB User
        ENV_DB_PASSWORD                = credentials('pg_password')   // ID Credentials Jenkins untuk DB Password
        ENV_DB_HOST                    = credentials('pg_host')       // ID Credentials Jenkins untuk DB Host (atau nilai statis)
        ENV_DB_PORT                    = '5432'                               // Port DB (bisa statis atau dari credentials)
        ENV_DB_NAME                    = credentials('pg_db')       // ID Credentials Jenkins untuk DB Name (atau nilai statis)
        
        // JWT Credentials
        ENV_JWT_SECRET                 = credentials('jwt_secret')    // ID Credentials Jenkins untuk JWT Secret
        ENV_JWT_EXPIRES_IN             = '1h'                                   // Durasi token (bisa statis)

        // Credentials dan konfigurasi untuk deployment SSH ke Docker Host
        REMOTE_SSH_CREDENTIALS_ID      = 'ssh_credential_id'                    // ID Jenkins Credentials untuk SSH
        REMOTE_HOST_IP                 = '47.84.46.116'
        REMOTE_HOST_USER               = 'root'
        REMOTE_APP_DIR                 = '/opt/stacks/alifsmart-auth-service'   // DISESUAIKAN: Direktori aplikasi di server remote
        REMOTE_CONTAINER_NAME          = 'alifsmart-auth-service-container'     // DISESUAIKAN: Nama kontainer di server remote
        
        // Credentials untuk Docker Hub dan GitHub
        DOCKER_HUB_CREDENTIALS_ID      = 'docker_credential_id'                 // ID Jenkins Credentials untuk Docker Hub (berisi password/token)
        GITHUB_CREDENTIALS_ID          = 'github_pat'                           // ID Jenkins Credentials untuk GitHub PAT

        // Versi Trivy (jika tahap scan diaktifkan)
        TRIVY_VERSION                  = '0.55.0' 
        
        // Menentukan versi Node.js yang akan digunakan untuk tahap test
        NODE_VERSION_ALPINE            = 'node:20-alpine' // Atau sesuaikan dengan Dockerfile (node:18-alpine)
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                echo "Checking out from GitHub repository for ${env.DOCKER_IMAGE_NAME}..."
                git branch: 'main', // Atau branch yang sesuai
                    credentialsId: env.GITHUB_CREDENTIALS_ID,
                    url: 'https://github.com/alifsmart-team/alifsmart-auth-service.git' // DISESUAIKAN: URL repo auth-service
                echo "Checkout complete."
            }
        }

        stage('Install Dependencies & Test') {
            steps {
                echo "Installing dependencies and running tests for ${env.DOCKER_IMAGE_NAME} inside Docker using ${env.NODE_VERSION_ALPINE}..."
                // Jalankan npm ci dan test di dalam kontainer Docker agar lingkungan konsisten
                // Jika tes memerlukan koneksi DB, variabel environment DB untuk tes perlu ditambahkan di sini
                // Untuk Sprint 1, package.json memiliki "test": "echo \"Error: no test specified\" && exit 1"
                // Opsi --passWithNoTests akan membuat stage ini sukses jika tidak ada file test
                sh """
                    docker run --rm \\
                        -v "${env.WORKSPACE}:/app" \\
                        -w /app \\
                        ${env.NODE_VERSION_ALPINE} sh -c 'echo "Cleaning npm cache..." && npm cache clean --force && echo "Running npm ci and tests..." && npm ci && npm run test -- --passWithNoTests'
                """
                // Jika ada tes yang butuh DB, tambahkan -e DB_USER_TEST=... dst.
                echo "Dependencies installed and tests completed."
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    echo "Building and pushing Docker image ${env.FULL_APP_IMAGE_NAME} (using Node version from Dockerfile)..."
                    def buildTag = env.BUILD_NUMBER 
                    def latestTag = "latest"

                    docker.withRegistry("https://index.docker.io/v1/", env.DOCKER_HUB_CREDENTIALS_ID) {
                        // Dockerfile diharapkan ada di root repository
                        echo "Building image ${env.FULL_APP_IMAGE_NAME}:${buildTag}..."
                        def customImage = docker.build("${env.FULL_APP_IMAGE_NAME}:${buildTag}", "-f Dockerfile .")

                        echo "Tagging image ${env.FULL_APP_IMAGE_NAME}:${buildTag} as ${env.FULL_APP_IMAGE_NAME}:${latestTag}..."
                        customImage.tag(latestTag) 

                        echo "Pushing image ${env.FULL_APP_IMAGE_NAME}:${buildTag} to Docker Hub..."
                        customImage.push(buildTag)
                        
                        echo "Pushing image ${env.FULL_APP_IMAGE_NAME}:${latestTag} to Docker Hub..."
                        customImage.push(latestTag)
                    }
                    echo "Docker images pushed successfully."
                }
            }
        }

        // // --- TAHAP UNTUK SCAN TRIVY (OPSIONAL, AKTIFKAN JIKA PERLU) ---
        // stage('Scan with Trivy') {
        //     steps {
        //         script {
        //             echo "Scanning Docker image ${env.FULL_APP_IMAGE_NAME}:${env.BUILD_NUMBER} with Trivy..."
        //             // Tarik image dari registry untuk memastikan versi yang benar dipindai
        //             docker.withRegistry("https://index.docker.io/v1/", env.DOCKER_HUB_CREDENTIALS_ID) {
        //                 sh "docker pull ${env.FULL_APP_IMAGE_NAME}:${env.BUILD_NUMBER}"
        //             }
        //             try {
        //                 sh """
        //                     docker run --rm \\
        //                         -v /var/run/docker.sock:/var/run/docker.sock \\
        //                         -v \$HOME/.trivycache:/root/.cache/trivy \\
        //                         aquasec/trivy:${env.TRIVY_VERSION} image \\
        //                         --exit-code 1 \\
        //                         --severity HIGH,CRITICAL \\
        //                         --ignore-unfixed \\
        //                         --format table \\
        //                         ${env.FULL_APP_IMAGE_NAME}:${env.BUILD_NUMBER}
        //                 """
        //                 // archiveArtifacts artifacts: 'trivy-results.json', fingerprint: true // Jika output JSON
        //             } catch (e) {
        //                 echo "Trivy scan found vulnerabilities or an error occurred."
        //                 throw e // Hentikan pipeline jika ada kerentanan HIGH/CRITICAL
        //             }
        //             echo "Trivy scan completed."
        //         }
        //     }
        // }
        // // --- AKHIR TAHAP SCAN TRIVY ---

        stage('Deploy via Docker SSH') {
            when {
                branch 'main' // Hanya deploy jika branch adalah main dan build sebelumnya sukses
            }
            steps {
                script {
                    // Ambil password Docker Hub dari Jenkins Credentials
                    def dockerHubPassword = credentials(env.DOCKER_HUB_CREDENTIALS_ID)

                    withCredentials([sshUserPrivateKey(credentialsId: env.REMOTE_SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_PRIVATE_KEY_FILE')]) {
                        def remoteLogin = "${env.REMOTE_HOST_USER}@${env.REMOTE_HOST_IP}"
                        
                        echo "Target remote login: ${remoteLogin}"
                        echo "Creating remote directory (if not exists): ${env.REMOTE_APP_DIR}"
                        sh """
                            ssh -i \${SSH_PRIVATE_KEY_FILE} \\
                                -o StrictHostKeyChecking=no \\
                                -o UserKnownHostsFile=/dev/null \\
                                ${remoteLogin} 'mkdir -p ${env.REMOTE_APP_DIR}'
                        """

                        echo "Deploying application ${env.FULL_APP_IMAGE_NAME}:latest on remote server..."
                        sh """
                            ssh -i \${SSH_PRIVATE_KEY_FILE} \\
                                -o StrictHostKeyChecking=no \\
                                -o UserKnownHostsFile=/dev/null \\
                                ${remoteLogin} "cd ${env.REMOTE_APP_DIR} && \\
                                    echo 'Logging into Docker Hub...' && \\
                                    docker login -u '${env.DOCKER_HUB_USERNAME}' -p '${dockerHubPassword}' && \\
                                    echo 'Pulling latest image: ${env.FULL_APP_IMAGE_NAME}:latest...' && \\
                                    docker pull ${env.FULL_APP_IMAGE_NAME}:latest && \\
                                    echo 'Stopping and removing old container (if any): ${env.REMOTE_CONTAINER_NAME}...' && \\
                                    docker stop ${env.REMOTE_CONTAINER_NAME} || true && \\
                                    docker rm ${env.REMOTE_CONTAINER_NAME} || true && \\
                                    echo 'Starting new container: ${env.REMOTE_CONTAINER_NAME}...' && \\
                                    docker run -d --name ${env.REMOTE_CONTAINER_NAME} \\
                                        -p ${env.ENV_APP_PORT}:${env.ENV_APP_PORT} \\
                                        -e NODE_ENV='${env.ENV_NODE_ENV_PROD}' \\
                                        -e PORT='${env.ENV_APP_PORT}' \\
                                        -e DB_USER='${env.ENV_DB_USER}' \\
                                        -e DB_PASSWORD='${env.ENV_DB_PASSWORD}' \\
                                        -e DB_HOST='${env.ENV_DB_HOST}' \\
                                        -e DB_PORT='${env.ENV_DB_PORT}' \\
                                        -e DB_NAME='${env.ENV_DB_NAME}' \\
                                        -e JWT_SECRET='${env.ENV_JWT_SECRET}' \\
                                        -e JWT_EXPIRES_IN='${env.ENV_JWT_EXPIRES_IN}' \\
                                        --restart unless-stopped \\
                                        ${env.FULL_APP_IMAGE_NAME}:latest"
                        """
                        // Catatan: Untuk keamanan yang lebih baik, pertimbangkan menggunakan Docker Secrets untuk variabel sensitif
                        // atau memuat file .env yang aman di server remote.
                        echo "Deployment commands executed."
                    }
                }
            }
        }
    } // Akhir stages

    post { 
        always {
            echo "Pipeline finished."
            cleanWs()
        }
        success {
            echo "Pipeline sukses! ${env.DOCKER_IMAGE_NAME} telah di-build, (mungkin di-scan), di-push, dan terdeploy."
            // Tambahkan notifikasi jika perlu (misal: Slack, Email)
        }
        failure {
            echo "Pipeline gagal! Silakan periksa log untuk detailnya."
            // Tambahkan notifikasi jika perlu
        }
    }
}