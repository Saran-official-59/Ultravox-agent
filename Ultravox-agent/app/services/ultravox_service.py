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
        self.api_url = "https://api.ultravox.ai/api/calls"  # Fixed API URL
        self.headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }

    def create_call(self):
        """Creates a call in Ultravox and returns the JSON containing joinUrl."""
        config = {
        "systemPrompt": settings.SYSTEM_PROMPT,
        "temperature": 0.7,
        "model": "fixie-ai/ultravox-70B",
        "voice": "Mark",
        "languageHint": "en-US",
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
        
        try:
            logger.info(f"Creating Ultravox call with config: {json.dumps(config, indent=2)}")
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=config
            )
            
            if not response.ok:
                logger.error(f"Ultravox API error: {response.status_code}")
                logger.error(f"Response content: {response.text}")
                response.raise_for_status()
            
            result = response.json()
            logger.info(f"Successfully created call: {json.dumps(result, indent=2)}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating call: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            raise

    async def get_call(self, call_id: str) -> Dict[str, Any]:
        """Get details of a specific call."""
        try:
            url = f"{self.api_url}/{call_id}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Error getting call {call_id}: {str(e)}")
            raise

    async def list_calls(self) -> List[Dict[str, Any]]:
        """List all calls."""
        try:
            url = f"{self.api_url}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers)
                #response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Error listing calls: {str(e)}")
            raise 
            raise 