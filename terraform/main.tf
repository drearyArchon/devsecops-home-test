provider "aws" {
  region = "us-east-1"
}

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
# ALB SG: Only accepts internal traffic (from the API Gateway VPC Link)
resource "aws_security_group" "alb_sg" {
  name        = "internal-alb-sg"
  description = "Allow traffic from API Gateway VPC Link"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block] 
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS SG: Zero Trust - Only accepts traffic from the ALB
resource "aws_security_group" "ecs_sg" {
  name        = "ecs-tasks-sg"
  description = "Allow traffic ONLY from Internal ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id] # This is the critical security link
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==========================================
# 3. Internal Application Load Balancer
# ==========================================
resource "aws_lb" "internal_alb" {
  name               = "attendance-internal-alb"
  internal           = true # Critical: Keeps the ALB in the Private Subnet
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_lb_target_group" "ecs_tg" {
  name        = "attendance-ecs-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Required for AWS Fargate
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
# 4. ECS Cluster & Service
# ==========================================
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs_task_execution_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_cluster" "app_cluster" {
  name = "attendance-app-cluster"
}

resource "aws_ecs_task_definition" "app_task" {
  family                   = "attendance-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([{
    name      = "attendance-app"
    image     = "your-docker-image-uri:latest"
    essential = true
    portMappings = [{ containerPort = 8080, hostPort = 8080 }]
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
    assign_public_ip = false # Critical: Enforces private subnet isolation
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ecs_tg.arn
    container_name   = "attendance-app"
    container_port   = 8080
  }
  
  depends_on = [aws_lb_listener.http]
}