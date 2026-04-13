output "instance_id" {
  value       = aws_instance.web.id
  description = "EC2 instance ID."
}

output "public_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IPv4 address."
}

output "public_dns" {
  value       = aws_instance.web.public_dns
  description = "Public DNS name."
}

output "ssh_command" {
  value       = var.key_name != "" ? "ssh -i <path-to-key> ec2-user@${aws_instance.web.public_dns}" : "Set key_name to generate an SSH command."
  description = "Convenience SSH command hint."
}
