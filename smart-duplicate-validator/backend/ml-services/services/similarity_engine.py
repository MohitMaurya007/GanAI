"""
Similarity Engine
Handles comparison of different media types and similarity scoring
"""

import asyncio
import os
from typing import Dict, Any, List
import numpy as np

from utils.logger import setup_logger

logger = setup_logger(__name__)

class SimilarityEngine:
    def __init__(self):
        self.default_thresholds = {
            'face_similarity': 0.6,
            'object_similarity': 0.7,
            'scene_similarity': 0.75,
            'audio_similarity': 0.8
        }
        logger.info("Similarity engine initialized")
    
    async def compare_files(self, file1_path: str, file2_path: str, 
                          media_type: str, thresholds: Dict[str, float]) -> Dict[str, Any]:
        """
        Compare two media files for similarity
        
        Args:
            file1_path: Path to first file
            file2_path: Path to second file
            media_type: Type of media (image, video, audio)
            thresholds: Similarity thresholds for different features
            
        Returns:
            Dictionary containing similarity results
        """
        try:
            # Merge with default thresholds
            final_thresholds = {**self.default_thresholds, **thresholds}
            
            if media_type.lower() == 'image':
                return await self._compare_images(file1_path, file2_path, final_thresholds)
            elif media_type.lower() == 'video':
                return await self._compare_videos(file1_path, file2_path, final_thresholds)
            elif media_type.lower() == 'audio':
                return await self._compare_audio(file1_path, file2_path, final_thresholds)
            else:
                raise ValueError(f"Unsupported media type: {media_type}")
                
        except Exception as e:
            logger.error(f"Error comparing files: {str(e)}")
            raise
    
    async def _compare_images(self, file1_path: str, file2_path: str, 
                            thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Compare two images for similarity"""
        # Mock implementation - would use actual ML services
        similarity_scores = {
            'face_similarity': np.random.rand() * 0.4 + 0.6,  # 0.6-1.0
            'object_similarity': np.random.rand() * 0.3 + 0.7,  # 0.7-1.0
            'scene_similarity': np.random.rand() * 0.25 + 0.75,  # 0.75-1.0
            'overall_similarity': 0.0
        }
        
        # Calculate weighted overall similarity
        weights = {'face_similarity': 0.4, 'object_similarity': 0.3, 'scene_similarity': 0.3}
        overall = sum(similarity_scores[key] * weights[key] for key in weights.keys())
        similarity_scores['overall_similarity'] = overall
        
        # Determine match type
        match_types = []
        if similarity_scores['face_similarity'] >= thresholds['face_similarity']:
            match_types.append('face')
        if similarity_scores['object_similarity'] >= thresholds['object_similarity']:
            match_types.append('object')
        if similarity_scores['scene_similarity'] >= thresholds['scene_similarity']:
            match_types.append('scene')
        
        return {
            **similarity_scores,
            'match_type': '+'.join(match_types) if match_types else 'none',
            'confidence': min(similarity_scores.values()),
            'thresholds_used': thresholds,
            'is_duplicate': overall >= max(thresholds.values())
        }
    
    async def _compare_videos(self, file1_path: str, file2_path: str, 
                            thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Compare two videos for similarity"""
        # Mock implementation
        similarity_scores = {
            'face_similarity': np.random.rand() * 0.4 + 0.6,
            'object_similarity': np.random.rand() * 0.3 + 0.7,
            'scene_similarity': np.random.rand() * 0.25 + 0.75,
            'audio_similarity': np.random.rand() * 0.2 + 0.8,
            'overall_similarity': 0.0
        }
        
        # Calculate weighted overall similarity for video
        weights = {
            'face_similarity': 0.25,
            'object_similarity': 0.25,
            'scene_similarity': 0.25,
            'audio_similarity': 0.25
        }
        overall = sum(similarity_scores[key] * weights[key] for key in weights.keys())
        similarity_scores['overall_similarity'] = overall
        
        # Determine match types
        match_types = []
        for feature, threshold in thresholds.items():
            if feature in similarity_scores and similarity_scores[feature] >= threshold:
                match_types.append(feature.replace('_similarity', ''))
        
        return {
            **similarity_scores,
            'match_type': '+'.join(match_types) if match_types else 'none',
            'confidence': min(similarity_scores.values()),
            'thresholds_used': thresholds,
            'is_duplicate': overall >= max(thresholds.values())
        }
    
    async def _compare_audio(self, file1_path: str, file2_path: str, 
                           thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Compare two audio files for similarity"""
        # Mock implementation
        similarity_scores = {
            'audio_similarity': np.random.rand() * 0.2 + 0.8,
            'overall_similarity': 0.0
        }
        
        similarity_scores['overall_similarity'] = similarity_scores['audio_similarity']
        
        match_types = []
        if similarity_scores['audio_similarity'] >= thresholds['audio_similarity']:
            match_types.append('audio')
        
        return {
            **similarity_scores,
            'match_type': '+'.join(match_types) if match_types else 'none',
            'confidence': similarity_scores['audio_similarity'],
            'thresholds_used': thresholds,
            'is_duplicate': similarity_scores['audio_similarity'] >= thresholds['audio_similarity']
        }
    
    async def batch_compare(self, target_file: str, candidate_files: List[str], 
                          media_type: str, thresholds: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Compare one file against multiple candidates
        
        Args:
            target_file: Path to target file
            candidate_files: List of candidate file paths
            media_type: Type of media
            thresholds: Similarity thresholds
            
        Returns:
            List of comparison results sorted by similarity
        """
        try:
            results = []
            
            for candidate_file in candidate_files:
                if candidate_file == target_file:
                    continue  # Skip self-comparison
                
                if not os.path.exists(candidate_file):
                    logger.warning(f"Candidate file not found: {candidate_file}")
                    continue
                
                comparison_result = await self.compare_files(
                    target_file, candidate_file, media_type, thresholds
                )
                
                results.append({
                    'candidate_file': candidate_file,
                    **comparison_result
                })
            
            # Sort by overall similarity (highest first)
            results.sort(key=lambda x: x.get('overall_similarity', 0), reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch comparison: {str(e)}")
            raise
    
    def calculate_confidence(self, similarity_scores: Dict[str, float]) -> float:
        """
        Calculate confidence score based on similarity scores
        
        Args:
            similarity_scores: Dictionary of similarity scores
            
        Returns:
            Confidence score (0-1)
        """
        try:
            # Use the minimum similarity as confidence (conservative approach)
            scores = [v for k, v in similarity_scores.items() if k != 'overall_similarity']
            return min(scores) if scores else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 0.0