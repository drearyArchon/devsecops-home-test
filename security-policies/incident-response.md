# Task 5

## Scenario A: Pipeline Security Failure

Response Strategy:
1. Because the pipeline is working as intended, the release is blocked.
2. Review the scan output to identify the vulnerability. Usually its a package or base image causing the issue. 
    - I'll advice the developer to switch to a patched image or to update the package dependency. The release should be delayed until the patch is done.
3. If a patch is unavailable and the release can't be delayed, we'll look into the vulnerability further and implement a countermeasure (A WAF rule can block exploit payloads while a tighter Security Group and IAM Roles can minimize risk). 
    - We'll need acceptance from the Security Lead before doing this and unblocking the pipeline.

## Scenario B: ECS Application Can't Access Secrets

Response Strategy:

1. **Check Recent Changes**: If the feature previously worked and now doesn't, I'd check for recent changes in configuration. Otherwise:
2. **Check IAM Execution Role**: Verify that the Execution Role has the appropriate permission (secretsmanager:GetSecretValue) and access to the specific secret.
3. **Check KMS Decryption**: If the secret is encrypted by a custom key, verify that the Execution Role has kms:Decrypt.
4. **Check Network / VPC Endpoints**: If the task resides in a private subnet with no internet access, verify that the VPC Interface Endpoint for Secrets Manager is active. I'd also check that the ECS Security Group allows outbound traffic to the VPC's Security Group.
5. **Check Resource Policies**: Check the Secrets Manager resource policy and make sure its not blocking the ECS cluster's VPC or IAM Role.

## Scenario C: Unauthorized AWS API Activity

Response Strategy:
1. **Immediate Containment**: Attatch a DenyAll IAM policy to the compromised CI/DC IAM Principal to prevent its access. Revoke any temporary security credentials and pause the pipeline's runners to prevent further actions.
2. **Investigation**: Query CloudTrail to audit API calls made by the compromosed Principal ARN over the last 30 days. Look for attempts to persist or send out data (e.g. iam:CreaterUser, s3:GetObject, rds:CreateDBSnapshot, etc) or to damage operations (e.g. s3:DeleteObject).
3. **Remediation**: Identify the root cause of the leak (e.g. hardcoded token in source control, exposed pipeline logs, etc). Rotate all exposed secrets, recreate the pipeline IAM role with scricter boundaries as per least-privilege principle.
