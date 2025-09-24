# Duplicate Media Detector

A comprehensive Next.js application for intelligently scanning, detecting, and validating duplicate media files (images, videos) across local uploads and cloud-based media libraries. Features advanced duplicate detection using hashing, perceptual similarity, and AI-powered near-duplicate detection.

## 🚀 Features

### Core Detection Capabilities
- **Exact Duplicate Detection**: MD5 and SHA-256 hashing for identical files
- **Perceptual Similarity**: Advanced image comparison using multiple algorithms (dHash, aHash, pHash, SSIM)
- **AI-Powered Near-Duplicate Detection**: Deep learning features with CNN simulation and traditional computer vision methods
- **Multi-Algorithm Comparison**: Combines structural, color, texture, and semantic similarity analysis

### User Interface & Experience
- **Intuitive Web Interface**: Modern, responsive design with real-time progress tracking
- **Drag-and-Drop Upload**: Easy file upload with support for multiple file types
- **Interactive Duplicate Groups**: Visual comparison with thumbnail generation
- **Manual Validation**: User verification and primary file selection
- **Advanced Filtering**: Filter by file type, date, size, source, and verification status

### Batch Operations
- **Bulk Deletion**: Delete multiple duplicates with safety confirmations
- **Batch Tagging**: Add tags to multiple files simultaneously
- **Bulk Verification**: Mark multiple duplicate groups as verified
- **Smart Primary Selection**: Automatically select highest quality files as primary

### Performance & Scalability
- **Worker Thread Processing**: Parallel file processing for large datasets
- **Streaming Operations**: Memory-efficient processing of massive file collections
- **Thumbnail Generation**: Automatic thumbnail creation with caching
- **Progress Tracking**: Real-time progress updates during scanning

### Cloud Integration
- **Google Drive**: OAuth-based integration with full metadata support
- **Dropbox**: Access and scan Dropbox media libraries
- **AWS S3**: Support for S3 buckets and S3-compatible storage
- **Multi-Source Scanning**: Compare files across different cloud providers

### Export & Reporting
- **Multiple Export Formats**: JSON, CSV, and PDF report generation
- **Detailed Analytics**: Comprehensive statistics and space savings calculations
- **Filterable Reports**: Export with applied filters and custom date ranges

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Image Processing**: Sharp, Jimp for cross-platform compatibility
- **File Operations**: Native Node.js fs operations with streaming
- **Cloud APIs**: Google Drive API, Dropbox API, AWS SDK
- **UI Components**: Headless UI, Lucide React icons
- **Performance**: Worker threads, streaming operations, caching

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/duplicate-media-detector.git
   cd duplicate-media-detector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Google Drive (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   
   # Dropbox (optional)
   DROPBOX_ACCESS_TOKEN=your_dropbox_access_token
   
   # AWS S3 (optional)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_BUCKET=your-bucket-name
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### Local File Scanning

1. **Upload Files**: Drag and drop media files or click to select
2. **Start Scan**: Click "Scan Uploaded Files" to begin analysis
3. **Review Results**: Examine detected duplicate groups
4. **Take Action**: Delete duplicates, tag files, or export reports

### Directory Scanning

1. **Enter Path**: Provide a local directory path
2. **Scan Directory**: Recursively scan all media files
3. **Filter Results**: Use advanced filters to narrow down results
4. **Batch Operations**: Perform bulk actions on multiple groups

### Cloud Integration

1. **Configure Provider**: Set up API credentials for your cloud service
2. **Authenticate**: Complete OAuth flow for Google Drive or configure tokens
3. **Select Folders**: Choose specific folders or scan entire libraries
4. **Cross-Platform Comparison**: Compare files across different cloud services

## 🔧 Configuration

### Similarity Thresholds

Adjust detection sensitivity in the UI or via API:
- **Exact Duplicates**: 100% match (file hash comparison)
- **Perceptual Similarity**: 90%+ (default, adjustable 70-99%)
- **Near-Duplicates**: 75%+ (AI-powered detection)

### Performance Tuning

- **Worker Threads**: Automatically uses CPU cores (max 8)
- **Batch Size**: Process files in batches of 100 (configurable)
- **Memory Management**: Streaming operations for large datasets
- **Cache Settings**: Feature caching for repeated comparisons

## 📊 API Endpoints

### File Upload
```http
POST /api/upload
Content-Type: multipart/form-data

# Upload multiple files for scanning
```

### Scan Operations
```http
POST /api/scan
Content-Type: application/json

{
  "action": "start",
  "sessionId": "uuid",
  "directoryPath": "/path/to/scan",
  "similarityThreshold": 90
}
```

### Duplicate Management
```http
POST /api/duplicates
Content-Type: application/json

{
  "action": "delete",
  "filePaths": ["/path/to/file1", "/path/to/file2"]
}
```

### Export Reports
```http
POST /api/export
Content-Type: application/json

{
  "format": "json|csv|pdf",
  "duplicateGroups": [...],
  "filters": {...}
}
```

## 🧪 Advanced Features

### AI-Powered Detection

The AI similarity detector uses multiple approaches:
- **Simulated CNN Features**: 512-dimensional feature vectors
- **Color Moments**: Mean, standard deviation, and skewness per channel
- **Local Binary Patterns**: Texture analysis for structural similarity
- **Edge Histograms**: Directional edge distribution analysis
- **Hybrid Scoring**: Weighted combination of all methods

### Performance Optimizations

- **Parallel Processing**: Multi-threaded file processing
- **Memory Streaming**: Process large datasets without memory overflow
- **Feature Caching**: Cache extracted features for repeated comparisons
- **Progressive Loading**: Load and display results as they're processed

### Cloud Provider Features

#### Google Drive
- OAuth 2.0 authentication
- Metadata extraction (EXIF, location, camera info)
- Folder structure navigation
- Storage quota monitoring

#### Dropbox
- Token-based authentication
- Media info extraction
- Shared link generation
- Account and storage information

#### AWS S3
- IAM-based authentication
- Object tagging support
- Presigned URL generation
- Bucket statistics and monitoring

## 🔒 Security & Privacy

- **Local Processing**: All file analysis happens locally
- **Secure Cloud Access**: OAuth 2.0 and IAM-based authentication
- **No Data Storage**: Files are not permanently stored on the server
- **Privacy First**: Only metadata is extracted, original files remain untouched

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Sharp and Jimp for image processing capabilities
- Next.js team for the excellent framework
- Cloud provider APIs for enabling cross-platform functionality
- Open source computer vision algorithms and research

## 📞 Support

For support, feature requests, or bug reports:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review existing issues and discussions

## 🚧 Roadmap

- [ ] Real TensorFlow.js integration for production AI features
- [ ] Video duplicate detection using frame analysis
- [ ] Integration with more cloud providers (OneDrive, iCloud)
- [ ] Mobile app companion
- [ ] Advanced metadata comparison
- [ ] Machine learning model training interface
- [ ] Enterprise features and API

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**