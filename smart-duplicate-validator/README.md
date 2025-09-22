# Smart Duplicate Media Validator

A comprehensive cross-platform application for intelligently detecting and validating duplicate media files using advanced AI/ML technologies.

## 🌟 Features

### 🔍 Intelligent Duplicate Detection
- **Facial Recognition**: Detect duplicate images based on faces using MediaPipe and face_recognition
- **Scene Analysis**: Identify similar scenes and environments using deep learning
- **Object Detection**: Match images based on detected objects and their relationships
- **Audio Fingerprinting**: Detect duplicate audio files and speech similarity
- **Configurable Thresholds**: Customize what qualifies as a "duplicate" for different use cases

### 🤖 AI/ML Integration
- **Face Detection**: Advanced facial recognition and comparison
- **Object Recognition**: YOLO-based object detection and classification
- **Scene Understanding**: ResNet-based scene analysis and embedding generation
- **Audio Processing**: Whisper AI for speech recognition and audio fingerprinting
- **Similarity Scoring**: Machine learning-based confidence scoring

### 💻 Cross-Platform Support
- **Web Application**: Modern React-based dashboard with Material-UI
- **Mobile App**: React Native app for iOS and Android
- **REST API**: Comprehensive backend API for integrations

### 👥 User Management
- **Admin**: Full system access, user management, threshold configuration
- **Standard User**: Media upload, duplicate review, personal settings
- **Reviewer**: Validation-only access for quality control

## 🏗️ Architecture

### Backend Services
- **API Server**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and caching
- **Queue System**: Bull for background job processing
- **ML Services**: Python FastAPI microservices for AI/ML processing

### Frontend Applications
- **Web Dashboard**: React 18 with TypeScript, Material-UI, Redux Toolkit
- **Mobile App**: React Native with navigation and offline support

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Health checks and logging across all services

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- Python 3.9+ (for ML services development)

### Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smart-duplicate-validator
   ```

2. Start all services:
   ```bash
   docker-compose up -d
   ```

3. Access the applications:
   - **Web Dashboard**: http://localhost:3001
   - **API Documentation**: http://localhost:3000
   - **ML Services**: http://localhost:8000/docs

### Manual Development Setup

#### Backend API
```bash
cd backend
npm install
cp .env.example .env
# Configure your database and Redis URLs in .env
npm run dev
```

#### ML Services
```bash
cd backend/ml-services
pip install -r requirements.txt
python main.py
```

#### Frontend Web App
```bash
cd frontend
npm install
npm start
```

#### Mobile App
```bash
cd mobile-app/SmartDuplicateValidator
npm install
# For iOS: cd ios && pod install
npm run android  # or npm run ios
```

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB available space
- **Network**: Stable internet connection

### Recommended for Production
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 500GB+ SSD
- **GPU**: NVIDIA GPU with CUDA support (for ML processing)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smart_duplicate_validator"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# ML Services
ML_SERVICE_URL="http://localhost:8000"

# File Upload
MAX_FILE_SIZE=100000000  # 100MB
UPLOAD_PATH="./uploads"
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3000
```

#### ML Services
```bash
REDIS_URL="redis://localhost:6379"
```

### Detection Thresholds

Configure similarity thresholds for different detection types:

- **Face Similarity**: 0.6 (60% confidence)
- **Object Similarity**: 0.7 (70% confidence)
- **Scene Similarity**: 0.75 (75% confidence)
- **Audio Similarity**: 0.8 (80% confidence)

## 📱 Mobile App Features

- **Camera Integration**: Capture photos and videos
- **Offline Support**: Local SQLite database
- **Real-time Sync**: Automatic synchronization
- **Push Notifications**: Processing status updates
- **Duplicate Review**: Mobile-friendly interface

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access Control**: Granular permissions
- **File Upload Validation**: Secure file handling
- **Rate Limiting**: API protection
- **CORS Protection**: Cross-origin security
- **SQL Injection Prevention**: Parameterized queries

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### ML Services Tests
```bash
cd backend/ml-services
pytest tests/
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📈 Performance Optimization

- **Asynchronous Processing**: Background job queues
- **Caching Strategy**: Redis caching for frequently accessed data
- **Database Optimization**: Indexed queries and connection pooling
- **CDN Integration**: Static asset delivery
- **Image Optimization**: Automatic thumbnail generation
- **Progressive Loading**: Efficient large dataset handling

## 🔄 API Documentation

The REST API provides comprehensive endpoints for:

- **Authentication**: Login, register, profile management
- **Media Management**: Upload, retrieve, delete files
- **Duplicate Detection**: Find and review duplicates
- **User Management**: Admin user operations
- **System Administration**: Settings and monitoring

Access interactive API documentation at: http://localhost:3000/docs

## 🚀 Deployment

### Docker Production Deployment
```bash
# Build and start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale ML services for high load
docker-compose up -d --scale ml-services=3
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

### Cloud Deployment Options
- **AWS**: ECS, EKS, or EC2 with RDS and ElastiCache
- **Google Cloud**: GKE, Cloud SQL, and Cloud Storage
- **Azure**: AKS, Azure Database, and Azure Storage

## 🔍 Monitoring and Logging

- **Health Checks**: Comprehensive service health monitoring
- **Application Logs**: Structured logging with log levels
- **Performance Metrics**: Response times and resource usage
- **Error Tracking**: Automated error reporting and alerts
- **Database Monitoring**: Query performance and connection health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript/JavaScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all CI/CD checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join community discussions
- **Email**: Contact the development team

## 🎯 Roadmap

### Version 1.0 (Current)
- [x] Basic duplicate detection
- [x] Web and mobile applications
- [x] User authentication and roles
- [x] Docker deployment

### Version 1.1 (Planned)
- [ ] Advanced ML model fine-tuning
- [ ] Batch processing improvements
- [ ] Enhanced mobile features
- [ ] Performance optimizations

### Version 2.0 (Future)
- [ ] Custom ML model training
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations
- [ ] Enterprise features

---

**Built with ❤️ by the Smart Duplicate Validator team**