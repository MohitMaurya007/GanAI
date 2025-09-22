"""
Face Detection Service
Handles face detection and recognition using MediaPipe and face_recognition
"""

import asyncio
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
import face_recognition
import mediapipe as mp
from pathlib import Path

from utils.logger import setup_logger

logger = setup_logger(__name__)

class FaceDetectionService:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0, min_detection_confidence=0.5
        )
        self.is_loaded = True
        logger.info("Face detection service initialized")
    
    def is_available(self) -> bool:
        """Check if the service is available"""
        return self.is_loaded
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_name": "MediaPipe Face Detection + face_recognition",
            "version": "0.8.0",
            "is_loaded": self.is_loaded,
            "capabilities": ["face_detection", "face_recognition", "face_encoding"]
        }
    
    async def reload_model(self):
        """Reload the face detection model"""
        try:
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=0, min_detection_confidence=0.5
            )
            self.is_loaded = True
            logger.info("Face detection model reloaded successfully")
        except Exception as e:
            logger.error(f"Failed to reload face detection model: {str(e)}")
            self.is_loaded = False
            raise
    
    async def detect_faces(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Detect faces in an image and extract features
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of face detection results with bounding boxes and embeddings
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image from {image_path}")
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Run MediaPipe face detection
            results = self.face_detection.process(rgb_image)
            
            faces = []
            
            if results.detections:
                for detection in results.detections:
                    # Extract bounding box
                    bbox = detection.location_data.relative_bounding_box
                    h, w, _ = image.shape
                    
                    x = int(bbox.xmin * w)
                    y = int(bbox.ymin * h)
                    width = int(bbox.width * w)
                    height = int(bbox.height * h)
                    
                    # Ensure bounding box is within image bounds
                    x = max(0, x)
                    y = max(0, y)
                    width = min(w - x, width)
                    height = min(h - y, height)
                    
                    # Extract face region for encoding
                    face_region = rgb_image[y:y+height, x:x+width]
                    
                    # Get face encoding using face_recognition
                    face_encodings = face_recognition.face_encodings(face_region)
                    
                    face_data = {
                        'bounding_box': {
                            'x': x,
                            'y': y,
                            'width': width,
                            'height': height
                        },
                        'confidence': detection.score[0],
                        'embedding': face_encodings[0].tolist() if face_encodings else None,
                        'landmarks': self._extract_landmarks(detection)
                    }
                    
                    faces.append(face_data)
            
            logger.info(f"Detected {len(faces)} faces in {image_path}")
            return faces
            
        except Exception as e:
            logger.error(f"Error detecting faces in {image_path}: {str(e)}")
            raise
    
    def _extract_landmarks(self, detection) -> Optional[List[Dict[str, float]]]:
        """Extract facial landmarks from MediaPipe detection"""
        try:
            if hasattr(detection, 'location_data') and hasattr(detection.location_data, 'relative_keypoints'):
                landmarks = []
                for keypoint in detection.location_data.relative_keypoints:
                    landmarks.append({
                        'x': keypoint.x,
                        'y': keypoint.y,
                        'z': getattr(keypoint, 'z', 0.0)
                    })
                return landmarks
        except Exception as e:
            logger.warning(f"Could not extract landmarks: {str(e)}")
        
        return None
    
    async def compare_faces(self, encoding1: List[float], encoding2: List[float], 
                          threshold: float = 0.6) -> Dict[str, Any]:
        """
        Compare two face encodings
        
        Args:
            encoding1: First face encoding
            encoding2: Second face encoding
            threshold: Similarity threshold
            
        Returns:
            Comparison result with similarity score
        """
        try:
            if not encoding1 or not encoding2:
                return {
                    'is_match': False,
                    'distance': float('inf'),
                    'similarity': 0.0
                }
            
            # Convert to numpy arrays
            enc1 = np.array(encoding1)
            enc2 = np.array(encoding2)
            
            # Calculate face distance
            distance = face_recognition.face_distance([enc1], enc2)[0]
            
            # Convert distance to similarity score (0-1)
            similarity = max(0.0, 1.0 - distance)
            
            is_match = distance <= threshold
            
            return {
                'is_match': is_match,
                'distance': float(distance),
                'similarity': float(similarity),
                'threshold': threshold
            }
            
        except Exception as e:
            logger.error(f"Error comparing faces: {str(e)}")
            raise
    
    async def find_similar_faces(self, target_encoding: List[float], 
                               face_database: List[Dict[str, Any]], 
                               threshold: float = 0.6) -> List[Dict[str, Any]]:
        """
        Find similar faces in a database
        
        Args:
            target_encoding: Target face encoding to match
            face_database: List of face data with encodings
            threshold: Similarity threshold
            
        Returns:
            List of matching faces sorted by similarity
        """
        try:
            matches = []
            
            for face_data in face_database:
                if 'embedding' not in face_data or not face_data['embedding']:
                    continue
                
                comparison = await self.compare_faces(
                    target_encoding, 
                    face_data['embedding'], 
                    threshold
                )
                
                if comparison['is_match']:
                    match_data = {
                        **face_data,
                        'similarity': comparison['similarity'],
                        'distance': comparison['distance']
                    }
                    matches.append(match_data)
            
            # Sort by similarity (highest first)
            matches.sort(key=lambda x: x['similarity'], reverse=True)
            
            return matches
            
        except Exception as e:
            logger.error(f"Error finding similar faces: {str(e)}")
            raise
    
    async def extract_face_features(self, image_path: str) -> Dict[str, Any]:
        """
        Extract comprehensive face features from an image
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing face features and metadata
        """
        try:
            faces = await self.detect_faces(image_path)
            
            return {
                'face_count': len(faces),
                'faces': faces,
                'has_faces': len(faces) > 0,
                'dominant_face': faces[0] if faces else None,  # Face with highest confidence
                'processing_metadata': {
                    'model': 'MediaPipe + face_recognition',
                    'image_path': image_path
                }
            }
            
        except Exception as e:
            logger.error(f"Error extracting face features: {str(e)}")
            raise