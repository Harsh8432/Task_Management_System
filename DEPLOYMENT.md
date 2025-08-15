# Deployment Guide

This guide covers various deployment options for the Task Management System, including both frontend and backend deployment strategies.

## 🚀 Quick Deployment Options

### 1. Vercel (Recommended for Frontend)

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

Vercel provides the fastest and easiest deployment for React applications.

#### Prerequisites
- GitHub account
- Vercel account

#### Steps
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   # Navigate to project root
   cd project
   
   # Deploy
   vercel
   ```

3. **Environment Variables**
   Set in Vercel dashboard:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.com/api
   VITE_WS_URL=wss://your-backend-url.com
   ```

4. **Custom Domain** (Optional)
   - Add domain in Vercel dashboard
   - Configure DNS records

#### Vercel Configuration
Create `vercel.json` in project root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Option 2: Netlify

#### Steps
1. **Connect to GitHub**
   - Push code to GitHub
   - Connect Netlify to repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   Set in Netlify dashboard:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.com/api
   VITE_WS_URL=wss://your-backend-url.com
   ```

### Option 3: GitHub Pages

#### Steps
1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/repository-name"
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

Railway provides easy deployment with automatic scaling and database integration.

#### Steps
1. **Connect Repository**
   - Connect GitHub repository to Railway
   - Select backend directory

2. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-production-jwt-secret
   JWT_EXPIRES_IN=7d
   REDIS_URL=redis://username:password@host:port
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

3. **Deploy**
   - Railway automatically deploys on push
   - Monitor deployment logs

### Option 2: Heroku

#### Prerequisites
- Heroku account
- Heroku CLI

#### Steps
1. **Create App**
   ```bash
   # Login to Heroku
   heroku login
   
   # Create app
   heroku create your-app-name
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set REDIS_URL=your-redis-url
   ```

3. **Deploy**
   ```bash
   # Add Heroku remote
   heroku git:remote -a your-app-name
   
   # Deploy
   git push heroku main
   ```

4. **Scale**
   ```bash
   # Scale to 1 dyno
   heroku ps:scale web=1
   ```

#### Heroku Configuration
Create `Procfile` in backend directory:
```
web: npm start
```

### Option 3: Render

#### Steps
1. **Connect Repository**
   - Connect GitHub repository
   - Select backend directory

2. **Build Settings**
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Environment Variables**
   Set in Render dashboard (same as Railway)

### Option 4: DigitalOcean App Platform

#### Steps
1. **Create App**
   - Select GitHub repository
   - Choose Node.js environment

2. **Configure**
   - Set build command: `npm run build`
   - Set run command: `npm start`
   - Configure environment variables

## 🐳 Docker Deployment

### Dockerfile for Backend

Create `Dockerfile` in backend directory:
```dockerfile
# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove source files
RUN rm -rf src/ tsconfig.json

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### Dockerfile for Frontend

Create `Dockerfile` in project root:
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_BASE_URL=http://localhost:5000/api

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/task-management
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

### Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### Option 1: AWS Elastic Beanstalk

1. **Prepare Application**
   ```bash
   # Create deployment package
   cd backend
   npm run build
   zip -r ../backend.zip .
   ```

2. **Deploy to Elastic Beanstalk**
   - Create new environment
   - Upload backend.zip
   - Configure environment variables

#### Option 2: AWS Lambda + API Gateway

1. **Serverless Framework**
   ```bash
   npm install -g serverless
   ```

2. **serverless.yml**
   ```yaml
   service: task-management-api
   
   provider:
     name: aws
     runtime: nodejs18.x
     region: us-east-1
   
   functions:
     api:
       handler: dist/server.handler
       events:
         - http:
             path: /{proxy+}
             method: ANY
   ```

3. **Deploy**
   ```bash
   serverless deploy
   ```

### Google Cloud Platform

#### Cloud Run Deployment

1. **Build Container**
   ```bash
   # Build image
   docker build -t gcr.io/PROJECT_ID/task-management-backend ./backend
   
   # Push to Container Registry
   docker push gcr.io/PROJECT_ID/task-management-backend
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy task-management-backend \
     --image gcr.io/PROJECT_ID/task-management-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## 🔒 Production Security

### Environment Variables
- Never commit `.env` files
- Use strong, unique secrets
- Rotate secrets regularly

### SSL/TLS
- Enable HTTPS for all production deployments
- Use Let's Encrypt for free certificates
- Configure HSTS headers

### Database Security
- Use connection strings with authentication
- Enable network security rules
- Regular backups

### API Security
- Rate limiting
- Input validation
- CORS configuration
- API key management (if needed)

## 📊 Monitoring & Logging

### Application Monitoring
- **Vercel Analytics**: Frontend performance
- **Railway Metrics**: Backend performance
- **Sentry**: Error tracking
- **LogRocket**: User session replay

### Health Checks
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected' // Check DB connection
  });
});
```

### Logging
```typescript
// Winston logger configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd backend
          npm ci
          npm run build
      - uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## 🔧 Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript compilation errors

2. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify variable values are correct

3. **Database Connection**
   - Check connection string format
   - Verify network access
   - Check authentication credentials

4. **Port Conflicts**
   - Ensure correct port is exposed
   - Check for port conflicts
   - Verify firewall settings

### Debug Commands
```bash
# Check application logs
docker-compose logs backend

# Check environment variables
heroku config

# Test database connection
mongo "your-connection-string" --eval "db.runCommand('ping')"

# Check application health
curl https://your-app.com/health
```
