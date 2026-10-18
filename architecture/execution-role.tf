# Database URL secret for the attendance backend
resource "aws_secretsmanager_secret" "db_url" {
  name        = "prod/attendance_board/db_url"
  description = "Database URL for the attendance backend"
  kms_key_id  = aws_kms_key.secrets_manager.arn # KMS Key used for encrypting this secret
}

# Least-privilege IAM role for ECS task execution
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs_task_execution_role"
  assume_role_policy = jsonencode({
    Version = "2026-10-18"
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Policy to get secrets from AWS Secrets Manager
data "aws_iam_policy_document" "ecs_attendance_board_secrets_read_only" {
  statement {
    effect = "Allow"

    # ONLY for fetching the secret
    actions = [
      "secretsmanager:GetSecretValue"
    ]

    # ONLY for this exact secret
    resources = [
      aws_secretsmanager_secret.db_url.arn
    ]
  }
}

# Attach policy to the ECS Execution Role
resource "aws_iam_role_policy" "ecs_execution_secrets_policy" {
  name   = "ecs-secrets-read-only"
  role   = aws_iam_role.ecs_execution_role.id
  policy = data.aws_iam_policy_document.ecs_attendance_board_secrets_read_only.json
}

# Policy to get images from AWS Elastic Container Registry (ECR)
data "aws_iam_policy_document" "ecs_get_attendance_board_image" {
  statement {
    effect = "Allow"

    # ONLY for fetching the image from ECR
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]

    # ONLY for a single ECR repository
    resources = [
      aws_ecr_repository.attendance_board.arn
    ]
  }
}

# Attach policy to the ECS Execution Role
resource "aws_iam_role_policy" "ecs_execution_ecr_policy" {
  name   = "ecs-get-attendance-board-image"
  role   = aws_iam_role.ecs_execution_role.id
  policy = data.aws_iam_policy_document.ecs_get_attendance_board_image.json
}

# Policy to stream logs to CloudWatch Logs
data "aws_iam_policy_document" "ecs_cloudwatch_logs_stream" {
  statement {
    effect = "Allow"

    # ONLY for writing cloudwatch logs
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    # ONLY for a single CloudWatch log group
    resources = [
      aws_cloudwatch_log_group.attendance_board.arn
    ]
  }
}

# Attach policy to the ECS Execution Role
resource "aws_iam_role_policy" "ecs_execution_cloudwatch_logs_policy" {
  name   = "ecs-cloudwatch-logs-stream"
  role   = aws_iam_role.ecs_execution_role.id
  policy = data.aws_iam_policy_document.ecs_cloudwatch_logs_stream.json
}
