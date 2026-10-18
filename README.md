## Architecture Overview

![Architecture Diagram](/architecture/architecture-diagram.png)

## 1. Request Flow

1. Users get JWT access tokens by logging into the **Cognito User Pool**. Cognito uses Multi-Factor Authentication to verify logins.

2. Requests come in from the internet through the **Amazon API Gateway**, which is shielded from malicious traffic and attacks by the **Web Application Firewall (WAF)**. API Gateway confirms login credentials and forwards the request.

3. **API Gateway** sends the request through its **VPC link** connection into a private subnet, where it reaches the internal **Application Load Balancer (ALB)**. Nothing past this point has any other exposure to the wider internet.

4. The **Application Load Balancer** routes the request to an **Elastic Container Service (ECS)** container is running an instance of the web service. The request is processed and the reply is sent back

5. **CloudWatch** and **CloudTrail** logs every interaction.

## 2. Public and Private Resources.

The only public resource is **Amazon API Gateway**'s endpoint, which is protected by the **Web Application Firewall (WAF)**, and **Cognito**'s login function. All other services are run internally.

Even creating users in Cognito could be done through an administrator for extra security, though otherwise only verified company emails should be able to sign up.

## 3. Secret Retrieval

When building the ECS Instance, the pipeline should give the instance an IAM Role to access the required Secrets on start up.

The CI/CD Pipeline is only responsible for building the container image and pushing it to a private **Elastic Container Registry (ECR)** repository. At runtime, the **Elastic Container Service (ECS)** instance assumes an IAM Execution Role to pull the specified image from the ECR and retrieve environment variables directly from **AWS Secrets Manager**.

Following the principle of least privilege, the Execution Role should only be able to access the specific ECR repository for its image, the specific Secrets used to run it, and the specific CloudWatch logs and streams used to monitor it.

## 4. IAM Roles

The CI/CD Pipeline only needs to access the **Elastic Container Registry (ECR)** repository used for its image and the **Elastic Container Service (ECS)** instances that it would push to. It never needs to touch AWS Secrets Manager.

The runtime application uses the Execution Role of its **ECS** container. It requires access to its specific **ECR repository**, its specific set of secrets in **Secrets Manager**, and its specific **CloudWatch streams**.
 
## 5. Unauthorized Access Prevention

Unauthorized access to production resources is prevented by storing the **Elastic Container Service (ECS)** and the **Application Load Balancer (ALB)** within a private subnet. **Amazon API Gateway** and **Cognito** will turn away unauthorized access, while the **Web Application Firewall (WAF)** will filter out malicious requests. 

In production environments, IAM Roles and Security Groups should be defined in both their resources and the actions they allow, strictly following the principle of least privilege. In a development environment, IAM Roles can be looser but services must be strictly limited to within secure networks.

## 6. Security Risks

There are a few security risks and their mitigations.

1. **Denial-of-Service Attacks**: Distributed malicious requests flooding a public endpoint to disrupt the service. This is minitaged by the **Web Application Firewall (WAF)**, which will filter them out.
2. **Unauthorized Access**: A hacker accessing the service without prior authentication, possibly leaking confidential information. This is mitigated by **Cognito User Pools** and **Amazon API Gateway**, which only allows authenticated users to access the service.
3. **Leaked Credentials**: A verified user leaking their credentials online by accident, possibly giving access to malicious actors. This is mitigated by adding **Multi-Factor-Authentication** to **Cognito User Pools**, adding another step to verification. Such leaks should also be reported to the administrator, who will prompt the users to change their passwords.
4. **Leaked Secrets**: An important secret accedentially being saved to the state and leaking to the wider web. This is mitigated by rotating secrets periodically using **AWS Secrets Manager**'s features. If a leak is reported, rotation should occur immediately instead of waiting for the scheduled time.
5. **Insecure Base Image**: Vulnerabilities passed down to our services from the image we use to build our Docker container. This is mitigated by refularly scanning for and patching vulnerabilities, blocking insecure deployments, and using minimum base images like alpine and distroless to reduce attack surfaces inherently.

# CI/CD Workflow

The pipelines are automatically triggered when an update occurs in the app folder (for sonar and container scan) or the terraform foler (for terraform scan).

The pipelines can be triggered manually in the Actions tab.

# Remaining Risks

