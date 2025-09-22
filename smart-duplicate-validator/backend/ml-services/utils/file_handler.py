"""
File handling utilities for ML services
"""

import os
import tempfile
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile

from utils.logger import setup_logger

logger = setup_logger(__name__)

class FileHandler:
    def __init__(self, temp_dir: Optional[str] = None):
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.temp_subdir = os.path.join(self.temp_dir, "ml_services_temp")
        
        # Create temp directory if it doesn't exist
        os.makedirs(self.temp_subdir, exist_ok=True)
        
        logger.info(f"FileHandler initialized with temp directory: {self.temp_subdir}")
    
    async def save_temp_file(self, file: UploadFile) -> str:
        """
        Save uploaded file to temporary location
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            Path to the saved temporary file
        """
        try:
            # Generate unique filename
            file_extension = Path(file.filename).suffix if file.filename else ""
            temp_filename = f"temp_{file.filename}_{os.getpid()}{file_extension}"
            temp_path = os.path.join(self.temp_subdir, temp_filename)
            
            # Save file
            with open(temp_path, "wb") as temp_file:
                content = await file.read()
                temp_file.write(content)
            
            logger.info(f"Saved temporary file: {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Error saving temporary file: {str(e)}")
            raise
    
    def cleanup_temp_file(self, file_path: str):
        """
        Remove temporary file
        
        Args:
            file_path: Path to the temporary file to remove
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Could not cleanup temporary file {file_path}: {str(e)}")
    
    def cleanup_temp_directory(self):
        """Clean up all temporary files in the temp directory"""
        try:
            if os.path.exists(self.temp_subdir):
                shutil.rmtree(self.temp_subdir)
                os.makedirs(self.temp_subdir, exist_ok=True)
                logger.info("Cleaned up temporary directory")
        except Exception as e:
            logger.error(f"Error cleaning up temporary directory: {str(e)}")
    
    def get_file_info(self, file_path: str) -> dict:
        """
        Get information about a file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dictionary containing file information
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            stat = os.stat(file_path)
            path_obj = Path(file_path)
            
            return {
                'filename': path_obj.name,
                'extension': path_obj.suffix,
                'size_bytes': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'modified_time': stat.st_mtime,
                'is_file': path_obj.is_file(),
                'absolute_path': str(path_obj.absolute())
            }
            
        except Exception as e:
            logger.error(f"Error getting file info for {file_path}: {str(e)}")
            raise
    
    def ensure_directory(self, directory_path: str):
        """
        Ensure directory exists, create if it doesn't
        
        Args:
            directory_path: Path to the directory
        """
        try:
            os.makedirs(directory_path, exist_ok=True)
            logger.debug(f"Ensured directory exists: {directory_path}")
        except Exception as e:
            logger.error(f"Error creating directory {directory_path}: {str(e)}")
            raise