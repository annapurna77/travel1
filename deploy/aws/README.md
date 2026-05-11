# AWS Deployment

This project is ready for a container-based AWS deployment.

## Suggested AWS Setup

- Frontend: Docker image served by nginx.
- Backend: Docker image running Express on port `5000`.
- Database: MongoDB Atlas is recommended for production. If you must run MongoDB on AWS, use a managed or carefully backed-up EC2 setup.
- Container registry: Amazon ECR.
- Runtime: ECS Fargate or EC2 with Docker Compose.

## Required Secrets

Set these in GitHub repository secrets before running `.github/workflows/aws-ecr.yml`:

```text
AWS_REGION
AWS_ROLE_TO_ASSUME
```

The AWS role needs permission to push to ECR repositories:

```text
travelapp-backend
travelapp-frontend
```

## Production Environment Variables

Backend:

```env
PORT=5000
MONGO_URL=mongodb+srv://...
JWT_SECRET=use-a-long-random-secret
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

Frontend:

```env
VITE_API_URL=/api
```

## Local Docker Run

From the repo root:

```sh
docker compose up --build
```

Open:

```text
http://localhost:8080
```

The frontend proxies `/api` to the backend container.
