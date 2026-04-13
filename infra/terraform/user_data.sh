#!/bin/bash
set -eux

yum update -y
amazon-linux-extras install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user
