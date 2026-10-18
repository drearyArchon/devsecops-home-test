# Task 6

## 1. DAST Pipeline Integration (OWASP ZAP)

- **Test Environment**: DAST requires a running application to run its tests. I would configure the pipeline (ideally Jenkins) to deploy a test container to an isolated stating environment. This prevents the test from affecting a production environment.

- **DAST Execution**: Once the staging deployment is healthy, the pipeline will trigger ZAP (through a hosted instance if using Jenkins, or the official GitHub Action on GitHub). The tool will begin attacking the staging endpoint.

- **Authentication**: I'd provision a test user within the staging Cognito User Pool. The popleline would inject the test user's credentials as a Secret, allowing ZAP to generate an access token and crawl through the protected endpoints.

- **Blocking Releases**: The ZAP GitHub Action is configured with rules_file_name to ignore false positives and fail_action: true. If ZAP detects vulnerabilities classified as HIGH or CRITICAL, it fails the pipeline and prevents merging to a production environment.

## 2. OWASP Mitigation

### A01: Broken Access

Broken Access is mitigated by our strict network isolation. Most of our services exist in a Private Subnet and only accepts traffic from the internal Application Load Balancer. It cannot be accessed directly from the internet.

IAM Roles also enforce the principle of least privilege, ensuring the application cannot access resources (like S3 or Lambda) outside of its scope.

### A02: Security Misconfiguration

Misconfiguration is actively prevented by the Ci/CD pipeline. Trivy runs a scan against all terraform code on each pull request and prevents misconfigurations (like overly permissive security group rules or public S3 buckets) from merging to production. 

Trivy can only be circumvented if the 'misconfiguration' labeled an acceptable risk by the Security Lead.

### A09: Security Logging and Alerting Failures

Logging Failures are mitigated by using AWS' comprehensive auditing and observability. Access logs should be stored to an S3 bucket to track incoming requests. Application logs from ECS containers are streamed directly to CloudWatch. Finally, CloudTrail is enabled accross the account to record AWS API calls, ensuring unauthorized infrastructure modifications are logged and alertable.
