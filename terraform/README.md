# Task 3

![Terraform File](main.tf)
![Example ECS IAM Execution Role](../architecture/execution-role.tf)
![Scan Outputs](/evidence/)

## Scenario A: Overly Permissive IAM

An IAM Permission that allows any action on any resource is effectively administrator access, and should be used cautiously. If a hacker were to somehow gain control of it, they would be able to do anything on our AWS account and using our budget.

An IAM Role like the one proposed is fine in a development-only account, provided that account has no exposure to the broader internet. Otherwise each Role needs to have limited scope in what it is allowed to do, what resources its allowed to use, and even *when* its allowed to do these things.

## Scenario B: Publically Accessible Resource

Changes in terraform should are scanned by Trivy, which would detect a CRITICAL or HIGH vulnerability and halt the pipeline. This would prevent the pull request from being merged onto a Release and from being deployed on production. If the access is considered acceptable, a comment can have Trivy ignore it.

Trivy could also be added to any Jenkins pipeline that handles deployment to halt the changes before they are implemented.

# Scenario C: Secret Exposure

If a password is already exposed, then it should be changed immediately to prevent its resource from being accessed. A hot fix needs to be pushed to erase the password, change it to a hidden variable, and then rotate that variable using **AWS SecretsManager** or **Key Management Store**.

A revealed password is only a problem for as long as it remains useful, so it needs to be changed quickly.