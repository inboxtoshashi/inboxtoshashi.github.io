// Declarative Jenkinsfile for Terraform workflows
// Requirements:
// - Add an AWS credential in Jenkins with id: aws-creds (AWS access key + secret)
// - Optional: set pipeline environment variables for backend (S3 bucket, region, key prefix, dynamodb table)
// - Ensure Terraform is installed on the Jenkins agent

pipeline {
  agent any

  parameters {
    string(name: 'ENV', defaultValue: 'dev', description: 'Environment to deploy (matches labs/<env>.tfvars)')
    booleanParam(name: 'RUN_PLAN', defaultValue: true, description: 'Run terraform plan')
    booleanParam(name: 'RUN_APPLY', defaultValue: false, description: 'Run terraform apply (requires approval)')
    booleanParam(name: 'RUN_DESTROY', defaultValue: false, description: 'Run terraform destroy (requires approval)')
  }

  environment {
    // Replace these with values from Jenkins global config / credentials if desired
    TF_BACKEND_BUCKET = credentials('TF_BACKEND_S3_BUCKET') // optional: use Jenkins credentials text or secret
    TF_BACKEND_REGION = 'us-east-1'
    TF_BACKEND_KEY_PREFIX = 'url_infra'
    TF_LOCK_TABLE = credentials('TF_DDB_TABLE') // optional
    AWS_CREDENTIALS_ID = 'aws-creds' // ensure this exists in Jenkins
    TF_VAR_FILE = "labs/${ENV}.tfvars"
  }

  options {
    ansiColor('xterm')
    timestamps()
    timeout(time: 60, unit: 'MINUTES')
  }

  stages {
    stage('Checkout') {
      steps {
        cleanWs()
        checkout scm
        sh 'ls -la'
      }
    }

    stage('Prereqs') {
      steps {
        sh 'terraform --version'
      }
    }

    stage('FMT & Validate') {
      steps {
        sh "cd labs/${ENV} && terraform fmt -check || (echo \"Run terraform fmt to fix formatting\"; exit 1)"
        sh "cd labs/${ENV} && terraform validate -var-file=${TF_VAR_FILE}"
      }
    }

    stage('Plan') {
      when { expression { params.RUN_PLAN == true } }
      steps {
        script {
          withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
            sh "cd labs/${ENV} && terraform init -input=false -backend-config=\"bucket=${TF_BACKEND_BUCKET}\" -backend-config=\"key=${TF_BACKEND_KEY_PREFIX}/${ENV}.tfstate\" -backend-config=\"region=${TF_BACKEND_REGION}\""
            sh "cd labs/${ENV} && terraform plan -var-file=${TF_VAR_FILE}"
          }
        }
      }
    }

    stage('Apply') {
      when { expression { params.RUN_APPLY == true } }
      steps {
        script {
          withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
              sh "cd labs/${ENV} && terraform init -input=false -backend-config=\"bucket=${TF_BACKEND_BUCKET}\" -backend-config=\"key=${TF_BACKEND_KEY_PREFIX}/${ENV}.tfstate\" -backend-config=\"region=${TF_BACKEND_REGION}\""
              sh "cd labs/${ENV} && terraform apply -var-file=${TF_VAR_FILE} -auto-approve"
          }
        }
      }
    }

    stage('Destroy') {
      when { expression { params.RUN_DESTROY == true } }
      steps {
        script {
          withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
            sh "cd labs/${ENV} && terraform init -input=false -backend-config=\"bucket=${TF_BACKEND_BUCKET}\" -backend-config=\"key=${TF_BACKEND_KEY_PREFIX}/${ENV}.tfstate\" -backend-config=\"region=${TF_BACKEND_REGION}\""
            sh "cd labs/${ENV} && terraform destroy -var-file=${TF_VAR_FILE} -auto-approve"
          }
        }
      }
    }

    stage('Pre-Install Requirements') {
      steps {
        echo 'Installing prerequisites...'
        sh './install_requirements/download_docker.sh'
      }
    }

    stage('Deploy URL App') {
      steps {
        echo 'Running deployment script...'
        sh './deploy_app/deploy_app.sh'
      }
    }
  }

  post {
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed. See logs for details.'
    }
      cleanWs()
    }
     always {
       cleanWs()
     }
  }
}
