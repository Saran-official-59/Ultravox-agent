import httpx # type: ignore
from typing import Dict, Any
from app.core.config import settings
from app.utils.logger import get_logger
from plivo import RestClient
import plivo

logger = get_logger(__name__)


class PlivoService:
    def __init__(self):
        self.client = RestClient(
            auth_id=settings.PLIVO_AUTH_ID,
            auth_token=settings.PLIVO_AUTH_TOKEN
        )

    async def speak_text(self, call_uuid: str, text: str, voice: str = "WOMAN", language: str = "en-US") -> Dict[str, Any]:
        """
        Use Plivo's Speak API to convert text to speech during a call.
        
        Args:
            call_uuid: The Plivo call UUID
            text: The text to speak
            voice: The voice to use (WOMAN, MAN)
            language: The language code
            
        Returns:
            The API response
        """
        try:
            url = f"https://api.plivo.com/v1/Account/{settings.PLIVO_AUTH_ID}/Call/{call_uuid}/Speak/"
            
            payload = {
                "text": text,
                "voice": voice,
                "language": language
            }
            
            logger.info(f"Speaking text on call {call_uuid}: {text[:50]}...")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    auth=(settings.PLIVO_AUTH_ID, settings.PLIVO_AUTH_TOKEN),
                    json=payload
                )
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"Successfully spoke text on call {call_uuid}")
                return result
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error speaking text: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error speaking text: {str(e)}")
            raise
    
    def generate_speak_xml(self, text: str, voice: str = "WOMAN", language: str = "en-US") -> str:
        """
        Generate Plivo XML for speaking text.
        
        Args:
            text: The text to speak
            voice: The voice to use
            language: The language code
            
        Returns:
            Plivo XML response
        """
        # Escape XML special characters
        text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;")
        
        return f"""
        <Response>
            <Speak voice="{voice}" language="{language}">{text}</Speak>
        </Response>
        """

    def create_call(self, join_url):
        """Create a new call using Plivo."""
        try:
            logger.info("Attempting to create call...")
            # Create explicit parameters dictionary
            call_params = {
                "from_": settings.PLIVO_PHONE_NUMBER,
                "to_": settings.TO_NUMBER,
                "answer_url": f"{settings.BASE_URL}/answer_url?join_url={join_url}",
                "answer_method": "POST"
            }
            
            # Log the exact parameters being used
            logger.info(f"Call parameters: {call_params}")
            
            # Create call with explicit parameters
            response = self.client.calls.create(**call_params)
            
            logger.info(f"Call created successfully: {response}")
            return response
            
        except TypeError as e:
            logger.error(f"TypeError in create_call: {str(e)}")
            logger.error(f"Plivo SDK version: {plivo.__version__}")
            raise
        except Exception as e:
            logger.error(f"Error creating call: {str(e)}")
            raise

    def generate_answer_xml(self, join_url):
        """Generate XML response for answer URL."""
        xml_data = f"""<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Stream
                keepCallAlive="true"
                bidirectional="true"
                contentType="audio/x-l16;rate=16000">
                {join_url}
            </Stream>
        </Response>"""
        logger.info(f"Generated XML: {xml_data}")
        return xml_data