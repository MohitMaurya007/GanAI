"""
Logging utility for ML services
"""

import sys
from loguru import logger

def setup_logger(name: str):
    """Setup logger with consistent formatting"""
    
    # Remove default logger
    logger.remove()
    
    # Add custom logger with formatting
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    # Add file logging
    logger.add(
        "logs/ml_services.log",
        rotation="10 MB",
        retention="30 days",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG"
    )
    
    return logger