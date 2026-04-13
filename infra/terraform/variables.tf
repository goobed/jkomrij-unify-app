variable "aws_region" {
  type        = string
  description = "AWS region to deploy into."
  default     = "us-east-1"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type."
  default     = "t2.micro"
}

variable "instance_name" {
  type        = string
  description = "Name tag for the EC2 instance."
  default     = "theme-park-demo"
}

variable "key_name" {
  type        = string
  description = "Optional EC2 key pair name for SSH access."
  default     = ""
}

variable "allowed_http_cidr" {
  type        = string
  description = "Comma-separated CIDR blocks allowed to access HTTP/API ports."
  default     = "0.0.0.0/0"
}
