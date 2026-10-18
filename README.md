## Architecture Overview

![Architecture Diagram](/architecture/architecture-diagram.png)

## Request Flow

1. Users get JWT access tokens by logging into the **Cognito User Pool**. Cognito uses Multi-Factor Authentication to verify logins.

2. Requests come in from the internet through the **Amazon API Gateway**, which is shielded from malicious traffic and attacks by the **Web Application Firewall (WAF)**. API Gateway confirms login credentials and forwards the request.

3. **API Gateway** sends the request through its **VPC link** connection into a private subnet, where it reaches the internal **Application Load Balancer (ALB)**. Nothing past this point has any other exposure to the wider internet.

4. The **Application Load Balancer** routes the request to an **Elastic Container Service (ECS)** container is running an instance of the web service. The request is processed and the reply is sent back

5. **CloudWatch** and **CloudTrail** logs every interaction.

# Prerequisites

Almost everything security related can be accessed through the GitHub repository without having to pull it. The pipelines are GitHub actions and the scan results are in the Security tab.

# CI/CD Workflow

There are two pipelines: app-scan and terraform-scan.

- app-scan uses SonarQube for SAST, halting merges if the code does not pass through its security gate (no Critical bugs and <80% test coverage). It also builds a temporary docker image and runs it through Trivy to check for vulnerabilities.

- terraform-scan validates the terraform file and then uses Trivy to look for vulnerabilities.

The pipelines are automatically triggered when an update occurs in the app folder (app-scan) or the terraform foler (for terraform-scan), but they can be **triggered manually in the Actions tab**.

# Security Gates

If either pipeline workflow fails, a pull request cannot merge into the main branch, preventing the code from being deployed onto production.

# Remaining Risks

There are several HIGH issues detected within the node:24-alpine base image that the app is using. These are not yet patched and need to be explicitly ignored for the pipeline to run successfully.

Per the vulnerability policy, new releases need to wait for a patch or for permission from the Security Lead.

## Evidence of Tests

![GitHub Actions](/evidence/github-actions-screenshot.png)
![Code Scan Results](/evidence/code-scan-results.png)
![SONAR](/evidence/sonar-cloud-dashboard.png)
