from asyncio import streams
import httpx # type: ignore
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.utils.logger import get_logger
from app.models.schemas import InactivityMessage, Message
import requests # type: ignore
import json

logger = get_logger(__name__)

class UltravoxService:
    def __init__(self):
        self.api_key = settings.ULTRAVOX_API_KEY
        self.api_url = "https://api.ultravox.ai/api/calls"
        self.headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }
        logger.info(f"Initialized UltravoxService with API URL: {self.api_url}")

    def create_call(self, to_number=None):
        """Creates a call in Ultravox and returns the JSON containing joinUrl."""
        # Use provided to_number or fall back to settings
        target_number = settings.TO_NUMBER
        
        if not target_number:
            logger.error("No target phone number provided")
            raise ValueError("No target phone number provided (TO_NUMBER)")
            
        logger.info(f"Creating Ultravox call to number: {target_number}")
        
        # Prepare webhook URL for Ultravox to call back
        webhook_url = f"{settings.BASE_URL}/webhook"
        
      
        payload = {
        "systemPrompt": settings.SYSTEM_PROMPT,
        "temperature": 0.7,
        "model": settings.AI_MODEL,
        "voice": settings.VOICE_NAME,
        "languageHint": settings.LANGUAGE_HINT,
        "initialMessages": [
            {
                "role": "MESSAGE_ROLE_USER",
                "text": "",
                "invocationId": "",
                "toolName": "",
                "errorDetails": "",
                "medium": "MESSAGE_MEDIUM_VOICE",
                "callStageMessageIndex": 1,
                "callStageId": "1",
            }
        ],
        "joinTimeout": "30s",
        "maxDuration": "300s",
        "timeExceededMessage": "Sorry, The Call Time Limit Exceeded. Goodbye!",
        "inactivityMessages": [
            {
                "duration": "20s",
                "message": "Inactivity Detected. Goodbye!",
                "endBehavior": "END_BEHAVIOR_HANG_UP_SOFT",
            },
        ],
        "selectedTools": [
            {
                "toolName": "hangUp",
            }
        ],
        "medium": {"plivo": {}},
        "recordingEnabled": False,
        "firstSpeaker": "FIRST_SPEAKER_USER",
        "transcriptOptional": True,
        "initialOutputMedium": "MESSAGE_MEDIUM_VOICE",
        "vadSettings": {
            "turnEndpointDelay": "1s",
            "minimumTurnDuration": "0.15s",
            "minimumInterruptionDuration": "0.5s",
            "frameActivationThreshold": 0.1,
        },
        "firstSpeakerSettings": {
            "user": {},
            # "agent": {
            #     "uninterruptible": True,
            #     "text": "Hello"
            # }
        },
        "experimentalSettings": {},
        "metadata": {},
        "initialState": {},
    }
        headers = {
            "X-API-Key": settings.ULTRAVOX_API_KEY,
            "Content-Type": "application/json"
            }
        
        logger.info(f"Creating Ultravox call with payload: {json.dumps(payload, indent=2)}")
        
        try:
            response = httpx.post(
                
                "https://api.ultravox.ai/api/calls", 
                headers=headers, 
                json=payload,
                
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Ultravox call created successfully with ID: {result.get('id', 'unknown')}")
            logger.debug(f"Full Ultravox response: {json.dumps(result, indent=2)}")
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error creating Ultravox call: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            raise
            
        except Exception as e:
            logger.error(f"Error creating Ultravox call: {str(e)}")
            raise

    async def get_call(self, call_id: str) -> Dict[str, Any]:
        """Get details of a specific call."""
        try:
            url = f"{self.api_url}/{call_id}"
            logger.info(f"Fetching call details for ID: {call_id}")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                result = response.json()
                logger.info(f"Successfully retrieved details for call: {call_id}")
                logger.debug(f"Call details: {json.dumps(result, indent=2)}")
                return result
                
        except Exception as e:
            logger.error(f"Error getting call {call_id}: {str(e)}")
            raise

    async def list_calls(self) -> List[Dict[str, Any]]:
        """List all calls."""
        try:
            url = f"{self.api_url}"
            logger.info("Fetching list of all calls")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                result = response.json()
                call_count = len(result)
                logger.info(f"Successfully retrieved {call_count} calls")
                return result
                
        except Exception as e:
            logger.error(f"Error listing calls: {str(e)}")
            raise 
            raise 