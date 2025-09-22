# Smart Duplicate Media Validator

A Next.js-based web application that intelligently detects and validates duplicate media files using advanced AI/ML techniques including facial recognition, scene analysis, object detection, and audio fingerprinting.

## 🚀 Features

### Core Functionality
- **AI-Powered Detection**: Advanced machine learning models for facial recognition, object detection, and scene analysis
- **Multi-Media Support**: Process images, videos, and audio files with specialized algorithms
- **Flexible Upload**: Support for local files and cloud storage integration (Google Drive, Dropbox, S3)
- **Visual Comparison**: Side-by-side comparison with similarity scores and confidence levels
- **Configurable Thresholds**: Adjust what qualifies as a "duplicate" based on use case

### User Roles
- **Admin**: Full access to all features, manage settings, users, and model configurations
- **Standard User**: Upload media, view duplicate suggestions, validate matches
- **Reviewer**: Limited access to validate or reject flagged duplicates

### Technical Features
- **Privacy-First**: Optional on-device processing and secure server-side isolation
- **Role-Based Access**: Comprehensive permission system
- **API-First**: RESTful APIs for easy integration with external systems
- **Responsive Design**: Modern UI built with Tailwind CSS and Shadcn UI
- **Real-Time Processing**: Immediate duplicate detection upon upload

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM, SQLite (development)
- **Authentication**: NextAuth.js with multiple providers
- **AI/ML**: TensorFlow.js, Sharp for image processing
- **File Handling**: Multer, Sharp, FFmpeg (for video processing)
- **Database**: SQLite (development), PostgreSQL (production ready)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-duplicate-media-validator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create upload directory**
   ```bash
   mkdir uploads
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `MAX_FILE_SIZE` | Maximum file size in bytes (default: 100MB) | No |
| `UPLOAD_DIR` | Upload directory path (default: ./uploads) | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | No |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | No |

### Detection Configuration

Admins can configure duplicate detection through the admin panel:

- **Similarity Threshold**: Minimum similarity score (0-100%)
- **Confidence Threshold**: Minimum AI confidence level (0-100%)
- **Auto-Approve Threshold**: Automatically approve matches above this score
- **Detection Methods**: Enable/disable specific AI analysis methods

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### File Management
- `POST /api/upload` - Upload media files
- `GET /api/files` - List user's files
- `DELETE /api/files/[id]` - Delete a file

### Duplicate Management
- `GET /api/duplicates` - Get user's duplicate matches
- `POST /api/duplicates/[matchId]/validate` - Validate a duplicate match

### Admin Endpoints
- `GET/POST /api/admin/config` - Get/update system configuration
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Manage users

## 🎯 Usage

### For Standard Users

1. **Sign Up/Sign In**: Create an account or sign in
2. **Upload Files**: Use the upload page to add media files
3. **Review Duplicates**: Check the duplicates page for AI-detected matches
4. **Validate Matches**: Approve, reject, or delete duplicate files
5. **Manage Library**: Browse and organize your media files

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` (admin role required)
2. **Monitor System**: View statistics and system health
3. **Configure Detection**: Adjust AI model thresholds and methods
4. **Manage Users**: View and manage user accounts
5. **Review Analytics**: Monitor system performance and accuracy

## 🧠 AI/ML Models

The application uses several AI techniques for duplicate detection:

### Image Analysis
- **Facial Recognition**: Detects and compares faces in images
- **Object Detection**: Identifies and compares objects within images
- **Scene Analysis**: Analyzes overall scene composition and similarity
- **Color Histograms**: Compares color distributions

### Video Analysis
- **Frame Extraction**: Samples key frames for image analysis
- **Motion Patterns**: Analyzes movement and transitions
- **Scene Segmentation**: Breaks video into distinct scenes

### Audio Analysis
- **Audio Fingerprinting**: Creates unique signatures for audio content
- **Speech Recognition**: Identifies and compares speech patterns
- **Spectral Analysis**: Analyzes frequency characteristics

## 🔒 Security & Privacy

- **Role-Based Access Control**: Comprehensive permission system
- **File Isolation**: User files are isolated and secure
- **Optional On-Device Processing**: Sensitive media can be processed locally
- **Secure Authentication**: Multiple authentication providers supported
- **Data Encryption**: All sensitive data is encrypted

## 🚀 Deployment

### Production Deployment

1. **Database Setup**: Configure PostgreSQL or your preferred database
2. **Environment Variables**: Set production environment variables
3. **Build Application**: `npm run build`
4. **Start Server**: `npm start`

### Docker Deployment

```dockerfile
# Dockerfile included for containerized deployment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation

## 🗺️ Roadmap

- [ ] Real-time duplicate detection
- [ ] Advanced video analysis
- [ ] Cloud storage integration
- [ ] Mobile app (React Native)
- [ ] Batch processing capabilities
- [ ] Advanced analytics dashboard
- [ ] Machine learning model training interface
- [ ] API rate limiting and quotas
- [ ] Multi-language support
- [ ] Advanced search and filtering

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.