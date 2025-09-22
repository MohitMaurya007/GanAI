"""
Smart Duplicate Media Validator - ML Services
Main FastAPI application for machine learning microservices
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import service modules
from services.face_detection import FaceDetectionService
from services.object_detection import ObjectDetectionService
from services.scene_analysis import SceneAnalysisService
from services.audio_processing import AudioProcessingService
from services.similarity_engine import SimilarityEngine
from utils.file_handler import FileHandler
from utils.logger import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Smart Duplicate Validator ML Services",
    description="Machine Learning microservices for media duplicate detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
face_service = FaceDetectionService()
object_service = ObjectDetectionService()
scene_service = SceneAnalysisService()
audio_service = AudioProcessingService()
similarity_engine = SimilarityEngine()
file_handler = FileHandler()

# Pydantic models
class ProcessingResult(BaseModel):
    success: bool
    processing_time: float
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class SimilarityRequest(BaseModel):
    file1_path: str
    file2_path: str
    media_type: str
    thresholds: Optional[Dict[str, float]] = None

class BatchProcessingRequest(BaseModel):
    file_paths: List[str]
    media_type: str
    features_to_extract: List[str]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "face_detection": face_service.is_available(),
            "object_detection": object_service.is_available(),
            "scene_analysis": scene_service.is_available(),
            "audio_processing": audio_service.is_available(),
        }
    }

# Image processing endpoints
@app.post("/process/image", response_model=ProcessingResult)
async def process_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    extract_faces: bool = True,
    extract_objects: bool = True,
    extract_scene: bool = True
):
    """Process an image file and extract features"""
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file temporarily
        file_path = await file_handler.save_temp_file(file)
        
        # Extract features
        features = {}
        
        if extract_faces:
            faces = await face_service.detect_faces(file_path)
            features['faces'] = faces
            features['face_count'] = len(faces)
        
        if extract_objects:
            objects = await object_service.detect_objects(file_path)
            features['objects'] = objects
            features['object_count'] = len(objects)
        
        if extract_scene:
            scene_data = await scene_service.analyze_scene(file_path)
            features.update(scene_data)
        
        # Clean up temp file
        background_tasks.add_task(file_handler.cleanup_temp_file, file_path)
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ProcessingResult(
            success=True,
            processing_time=processing_time,
            data=features
        )
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return ProcessingResult(
            success=False,
            processing_time=0,
            error=str(e)
        )

@app.post("/process/video", response_model=ProcessingResult)
async def process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    extract_keyframes: bool = True,
    extract_audio: bool = True
):
    """Process a video file and extract features"""
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Validate file type
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Save uploaded file temporarily
        file_path = await file_handler.save_temp_file(file)
        
        features = {}
        
        if extract_keyframes:
            # Extract keyframes and analyze them
            keyframes = await scene_service.extract_keyframes(file_path)
            features['keyframes'] = keyframes
            
            # Analyze faces and objects in keyframes
            faces_in_video = []
            objects_in_video = []
            
            for keyframe_path in keyframes:
                faces = await face_service.detect_faces(keyframe_path)
                objects = await object_service.detect_objects(keyframe_path)
                
                faces_in_video.extend(faces)
                objects_in_video.extend(objects)
            
            features['faces'] = faces_in_video
            features['objects'] = objects_in_video
        
        if extract_audio:
            # Extract and process audio track
            audio_features = await audio_service.extract_audio_features(file_path)
            features.update(audio_features)
        
        # Clean up temp files
        background_tasks.add_task(file_handler.cleanup_temp_file, file_path)
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ProcessingResult(
            success=True,
            processing_time=processing_time,
            data=features
        )
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return ProcessingResult(
            success=False,
            processing_time=0,
            error=str(e)
        )

@app.post("/process/audio", response_model=ProcessingResult)
async def process_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    extract_fingerprint: bool = True,
    transcribe_speech: bool = True
):
    """Process an audio file and extract features"""
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Validate file type
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Save uploaded file temporarily
        file_path = await file_handler.save_temp_file(file)
        
        features = {}
        
        if extract_fingerprint:
            fingerprint = await audio_service.generate_fingerprint(file_path)
            features['audio_fingerprint'] = fingerprint
        
        if transcribe_speech:
            transcription = await audio_service.transcribe_speech(file_path)
            features['speech_text'] = transcription
        
        # Extract audio embeddings
        embedding = await audio_service.extract_embedding(file_path)
        features['audio_embedding'] = embedding
        
        # Clean up temp file
        background_tasks.add_task(file_handler.cleanup_temp_file, file_path)
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ProcessingResult(
            success=True,
            processing_time=processing_time,
            data=features
        )
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return ProcessingResult(
            success=False,
            processing_time=0,
            error=str(e)
        )

@app.post("/similarity/compare", response_model=ProcessingResult)
async def compare_files(request: SimilarityRequest):
    """Compare two media files for similarity"""
    try:
        start_time = asyncio.get_event_loop().time()
        
        similarity_result = await similarity_engine.compare_files(
            request.file1_path,
            request.file2_path,
            request.media_type,
            request.thresholds or {}
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ProcessingResult(
            success=True,
            processing_time=processing_time,
            data=similarity_result
        )
        
    except Exception as e:
        logger.error(f"Error comparing files: {str(e)}")
        return ProcessingResult(
            success=False,
            processing_time=0,
            error=str(e)
        )

@app.post("/batch/process", response_model=ProcessingResult)
async def batch_process(request: BatchProcessingRequest):
    """Process multiple files in batch"""
    try:
        start_time = asyncio.get_event_loop().time()
        
        results = []
        
        for file_path in request.file_paths:
            if not os.path.exists(file_path):
                logger.warning(f"File not found: {file_path}")
                continue
            
            file_features = {}
            
            if request.media_type == "image":
                if "faces" in request.features_to_extract:
                    faces = await face_service.detect_faces(file_path)
                    file_features['faces'] = faces
                
                if "objects" in request.features_to_extract:
                    objects = await object_service.detect_objects(file_path)
                    file_features['objects'] = objects
                
                if "scene" in request.features_to_extract:
                    scene_data = await scene_service.analyze_scene(file_path)
                    file_features.update(scene_data)
            
            elif request.media_type == "audio":
                if "fingerprint" in request.features_to_extract:
                    fingerprint = await audio_service.generate_fingerprint(file_path)
                    file_features['audio_fingerprint'] = fingerprint
                
                if "transcription" in request.features_to_extract:
                    transcription = await audio_service.transcribe_speech(file_path)
                    file_features['speech_text'] = transcription
            
            results.append({
                'file_path': file_path,
                'features': file_features
            })
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return ProcessingResult(
            success=True,
            processing_time=processing_time,
            data={'results': results, 'processed_count': len(results)}
        )
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        return ProcessingResult(
            success=False,
            processing_time=0,
            error=str(e)
        )

# Model management endpoints
@app.get("/models/status")
async def get_model_status():
    """Get status of all loaded models"""
    return {
        "face_detection": face_service.get_model_info(),
        "object_detection": object_service.get_model_info(),
        "scene_analysis": scene_service.get_model_info(),
        "audio_processing": audio_service.get_model_info(),
    }

@app.post("/models/reload")
async def reload_models():
    """Reload all ML models"""
    try:
        await face_service.reload_model()
        await object_service.reload_model()
        await scene_service.reload_model()
        await audio_service.reload_model()
        
        return {"success": True, "message": "All models reloaded successfully"}
    except Exception as e:
        logger.error(f"Error reloading models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )