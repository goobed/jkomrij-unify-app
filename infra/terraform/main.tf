provider "aws" {
  region = var.aws_region
}

data "aws_vpc" "default" {
  id = "vpc-010f7ba0928c1f904"
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "tag:Name"
    values = ["*public*"]
  }
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  http_cidrs = compact(split(",", var.allowed_http_cidr))
}

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ssm" {
  name               = "${var.instance_name}-ssm-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = {
    "cb-owner" = "zstace"
    Name       = "${var.instance_name}-ssm-role"
  }
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm" {
  name = "${var.instance_name}-ssm-profile"
  role = aws_iam_role.ssm.name

  tags = {
    "cb-owner" = "zstace"
    Name       = "${var.instance_name}-ssm-profile"
  }
}

resource "aws_security_group" "web" {
  name        = "${var.instance_name}-sg"
  description = "Security group for theme park demo"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = length(local.http_cidrs) > 0 ? local.http_cidrs : ["0.0.0.0/0"]
  }

  ingress {
    description = "API"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = length(local.http_cidrs) > 0 ? local.http_cidrs : ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    "cb-owner" = "zstace"
    Name       = "${var.instance_name}-sg"
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.public.ids[0]
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ssm.name
  key_name               = var.key_name != "" ? var.key_name : null
  user_data              = file("${path.module}/user_data.sh")
  associate_public_ip_address = true

  tags = {
    "cb-owner" = "zstace"
    Name       = var.instance_name
  }
}
