# Infrastructure Deployment

AWS infrastructure provisioning for the App Starter project using Pulumi and TypeScript.

## 🏗️ Architecture Overview

This infrastructure deploys:
- **Database**: PostgreSQL RDS instance with automated backups
- **Application**: Containerized NestJS backend with auto-scaling
- **Networking**: VPC, subnets, security groups, load balancer
- **DNS**: Route53 hosted zone and SSL certificates
- **Secrets**: AWS Systems Manager Parameter Store for sensitive data
- **Monitoring**: CloudWatch logs and metrics

## 📋 Prerequisites

### Required Tools
```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Install AWS CLI
# macOS: brew install awscli
# Linux: pip install awscli

# Install Node.js 22+ and pnpm  
# macOS: brew install node pnpm
```

### AWS Account Setup
1. **AWS Account** with administrative access
2. **AWS CLI configured** with appropriate credentials:
   ```bash
   aws configure
   ```
3. **Domain name** registered and managed in Route53
4. **Hosted Zone ID** for your domain

## 🛠️ Configuration

### 1. Update Pulumi Configuration
Edit `Pulumi.dev.yaml` with your specific values:

```yaml
config:
  aws:region: us-east-1                           # Your preferred AWS region
  dns:domain: your-domain.com                     # Your domain name
  dns:hostedZoneId: Z1234567890ABCDEF             # Your Route53 hosted zone ID
  mail:host: email-smtp.us-east-1.amazonaws.com   # Your SMTP host
  mail:senderAddress: noreply@your-domain.com     # Your sender email
  ssm:keyPrefix: app/dev                          # SSM parameter prefix
  app-starter:resourceNamePrefix: your-app        # Resource naming prefix
```

### 2. Set Up AWS Secrets
Store sensitive configuration in AWS Systems Manager Parameter Store:

```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Set your SSM key prefix (match Pulumi.dev.yaml)
export SSM_PREFIX="app/dev"

# Create secure parameters
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/AUTH_JWT_SECRET" \
  --value "your-super-secure-jwt-secret-here" \
  --type "SecureString" \
  --description "JWT secret for authentication"

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/MAIL_USER" \
  --value "your-smtp-username" \
  --type "SecureString" \
  --description "SMTP authentication username"

aws ssm put-parameter \
  --name "/${SSM_PREFIX}/MAIL_PASSWORD" \
  --value "your-smtp-password" \
  --type "SecureString" \
  --description "SMTP authentication password"
```

### 3. Verify Domain Setup
Ensure your domain is properly configured:
```bash
# Check if your domain's hosted zone exists
aws route53 list-hosted-zones-by-name --dns-name your-domain.com

# Note the HostedZoneId for your Pulumi configuration
```

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
cd infrastructure
pnpm install
```

### 2. Initialize Pulumi Stack
```bash
# Login to Pulumi (choose your backend)
pulumi login  # For Pulumi Service (free tier available)
# OR
pulumi login --local  # For local state management

# Initialize the stack
pulumi stack init dev
```

### 3. Preview Deployment
```bash
# Preview what will be created
pulumi preview

# Review the planned changes carefully
# Ensure all configurations look correct
```

### 4. Deploy Infrastructure
```bash
# Deploy the infrastructure
pulumi up

# Type 'yes' when prompted to confirm deployment
# This process typically takes 10-15 minutes
```

### 5. Verify Deployment
```bash
# Check deployment status
pulumi stack output

# Test the application endpoint
curl https://your-domain.com/api/health
```

## 📊 Post-Deployment

### Application Access
- **API Endpoint**: `https://your-domain.com/api`
- **Health Check**: `https://your-domain.com/api/health`
- **API Documentation**: `https://your-domain.com/api/docs`

### Database Access
The database is only accessible from within the VPC for security. To connect:

1. **Via Application**: The deployed app automatically connects
2. **For Management**: Use an EC2 bastion host or VPN connection
3. **Database Details**: Available in Pulumi stack outputs

### Logs and Monitoring
```bash
# View application logs
aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/app-starter"

# Follow real-time logs
aws logs tail "/aws/ecs/app-starter" --follow
```

## 🔧 Configuration Management

### Environment Variables
The infrastructure automatically configures these environment variables for the application:

**General Configuration:**
- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `HOSTNAME=your-domain.com`
- `PORT=3000`
- `REVERSE_PROXY_PORT=443`
- `CORS_ALLOWED_ORIGINS=https://your-domain.com`

**Database Configuration:**
- `DATABASE_HOST` (RDS endpoint)
- `DATABASE_PORT=5432`
- `DATABASE_NAME` (from RDS)
- `DATABASE_USERNAME` (from RDS)
- `DATABASE_PASSWORD` (from AWS Secrets Manager)
- `DATABASE_SSL=true`
- `DATABASE_LOGGING=false`

**Authentication Configuration:**
- `AUTH_JWT_ISSUER=App`
- `AUTH_JWT_SECRET` (from SSM Parameter Store)
- `AUTH_JWT_EXPIRES_IN=7d`
- `AUTH_COOKIE_NAME=access_token`
- `AUTH_SALT_ROUNDS=12`

**Mail Configuration:**
- `MAIL_HOST` (from configuration)
- `MAIL_PORT=587`
- `MAIL_USER` (from SSM Parameter Store)
- `MAIL_PASSWORD` (from SSM Parameter Store)
- `MAIL_SECURE=true`
- `MAIL_FROM_NAME=App`
- `MAIL_FROM_EMAIL` (from configuration)

### Updating Secrets
```bash
# Update JWT secret
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/AUTH_JWT_SECRET" \
  --value "new-jwt-secret" \
  --type "SecureString" \
  --overwrite

# Update email credentials
aws ssm put-parameter \
  --name "/${SSM_PREFIX}/MAIL_USER" \
  --value "new-username" \
  --type "SecureString" \
  --overwrite

# Restart the application to pick up new secrets
# (Application will automatically restart in ECS)
```

## 🔄 Updates and Maintenance

### Updating Infrastructure
```bash
# Make changes to your Pulumi code or configuration
# Preview changes
pulumi preview

# Apply updates
pulumi up
```

### Updating Application
The infrastructure is designed for container-based deployments. Update your application by:

1. Building and pushing a new container image
2. Updating the ECS service to use the new image
3. ECS will perform a rolling update automatically

### Backup and Recovery
- **Database Backups**: Automated daily backups with 7-day retention
- **Point-in-time Recovery**: Available for the database
- **Infrastructure State**: Pulumi state is managed in your chosen backend

## 🔒 Security Considerations

### Network Security
- Application runs in private subnets
- Database is only accessible from application subnets
- Load balancer provides SSL termination
- Security groups restrict access to necessary ports only

### Secrets Management
- All sensitive data stored in AWS Parameter Store (encrypted)
- Database password managed by AWS Secrets Manager
- Application retrieves secrets at runtime
- No secrets stored in code or configuration files

### SSL/TLS
- Automatic SSL certificate provisioning via ACM
- HTTPS enforced for all web traffic
- Secure communication between all components

## 🧹 Cleanup

To destroy the infrastructure:

```bash
# Preview what will be destroyed
pulumi destroy --show-config

# Destroy the infrastructure
pulumi destroy

# Type 'yes' when prompted
# This process typically takes 5-10 minutes
```

**Note**: This will permanently delete all resources including the database. Ensure you have backups if needed.

## 🆘 Troubleshooting

### Common Issues

**Deployment Fails with DNS Errors:**
- Verify your hosted zone ID is correct
- Ensure the domain is properly configured in Route53
- Check that your AWS credentials have Route53 permissions

**Application Not Starting:**
- Check ECS task logs: `aws logs tail "/aws/ecs/app-starter" --follow`
- Verify all required SSM parameters are set
- Ensure database is accessible from application subnets

**SSL Certificate Issues:**
- Certificate validation requires DNS control
- Ensure your domain's nameservers point to Route53
- Certificate provisioning can take 5-10 minutes

**Database Connection Issues:**
- Verify security group rules allow database access
- Check that DATABASE_HOST environment variable is correct
- Ensure database is in the same VPC as the application

### Getting Help
- Check Pulumi stack outputs: `pulumi stack output`
- Review AWS CloudFormation events in the console
- Examine ECS task definitions and service status
- Monitor CloudWatch logs for application errors

### Support Resources
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Project Repository Issues](https://github.com/your-repo/issues)