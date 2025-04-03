import logging
import sys
import os
from datetime import datetime
from app.core.config import settings

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Configure logging with both file and console output
def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name and enhanced logging capabilities."""
    logger = logging.getLogger(name)
    
    # Set log level from settings
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Prevent adding handlers multiple times
    if not logger.handlers:
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(detailed_formatter)
        logger.addHandler(console_handler)
        
        # File handler - create a new log file daily
        today = datetime.now().strftime('%Y-%m-%d')
        file_handler = logging.FileHandler(f"logs/ultravox-agent-{today}.log")
        file_handler.setFormatter(detailed_formatter)
        logger.addHandler(file_handler)
    
    return logger 