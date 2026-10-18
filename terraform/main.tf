provider "aws" {
  region = "us-east-1"
}

# Not yet usable without full implementation
# module "execution_role" {
#   source = "../architecture"
# }

# ==========================================
# 1. VPC & Private Subnets
# ==========================================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# ALB requires at least two subnets in different AZs
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
}

# ==========================================
# 2. Strict Security Groups
# ==========================================

# Security group for the endpoints to accept traffic from ECS
resource "aws_security_group" "vpc_endpoints_sg" {
  name        = "vpc-endpoints-sg"
  description = "Allow ECS to communicate with AWS Services securely"
  vpc_id      = aws_vpc.main.id
}

resource "aws_security_group_rule" "vpc_endpoint_ingress" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.vpc_endpoints_sg.id
  source_security_group_id = aws_security_group.ecs_sg.id
}

# ALB only accepts internal traffic (from the API Gateway VPC Link)
resource "aws_security_group" "alb_sg" {
  name        = "internal-alb-sg"
  description = "Allow traffic from API Gateway VPC Link"
  vpc_id      = aws_vpc.main.id
}

resource "aws_security_group_rule" "alb_ingress" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = [aws_vpc.main.cidr_block]
  security_group_id = aws_security_group.alb_sg.id
}

resource "aws_security_group_rule" "alb_egress" {
  type                     = "egress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  security_group_id        = aws_security_group.alb_sg.id
  source_security_group_id = aws_security_group.ecs_sg.id
}

# ECS only accepts traffic from the ALB
resource "aws_security_group" "ecs_sg" {
  name        = "ecs-tasks-sg"
  description = "Allow traffic from Internal ALB"
  vpc_id      = aws_vpc.main.id
}

resource "aws_security_group_rule" "ecs_ingress" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs_sg.id
  source_security_group_id = aws_security_group.alb_sg.id
}

resource "aws_security_group_rule" "ecs_egress" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs_sg.id
  source_security_group_id = aws_security_group.vpc_endpoints_sg.id
}

# ==========================================
# 3. VPC Endpoints (For True Network Isolation)
# ==========================================

# Endpoints required for ECS to pull images, secrets, and send logs without the internet
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints_sg.id]
  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints_sg.id]
  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "cloudwatch_logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  security_group_ids  = [aws_security_group.vpc_endpoints_sg.id]
  private_dns_enabled = true
}

# ECR requires an S3 Gateway endpoint to pull the actual image layers
# Attach this to the private subnet route tables
resource "aws_vpc_endpoint" "s3_gateway" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
}

# ==========================================
# 4. Internal Application Load Balancer
# ==========================================
# ALB is internal and only accessible through the API Gateway VPC Link
resource "aws_lb" "internal_alb" {
  name                       = "attendance-internal-alb"
  internal                   = true
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb_sg.id]
  subnets                    = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  drop_invalid_header_fields = true
}

resource "aws_lb_target_group" "ecs_tg" {
  name        = "attendance-ecs-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.internal_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs_tg.arn
  }
}

# ==========================================
# 5. ECS Cluster & Service
# ==========================================

resource "aws_ecs_cluster" "app_cluster" {
  name = "attendance-board-cluster"
}

resource "aws_ecs_task_definition" "app_task" {
  family                   = "attendance-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  # Requires further implementation
  # execution_role_arn       = module.execution_role.ecs_execution_role.arn

  container_definitions = jsonencode([{
    name         = "attendance-board"
    image        = "attendance-board:latest"
    essential    = true
    portMappings = [{ containerPort = 3000, hostPort = 3000 }]
  }])
}

resource "aws_ecs_service" "app_service" {
  name            = "attendance-service"
  cluster         = aws_ecs_cluster.app_cluster.id
  task_definition = aws_ecs_task_definition.app_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ecs_tg.arn
    container_name   = "attendance-board"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}
