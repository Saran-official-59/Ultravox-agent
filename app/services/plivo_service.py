import httpx # type: ignore
from typing import Dict, Any
from app.core.config import settings
from app.utils.logger import get_logger
from plivo import RestClient
import xml.dom.minidom

logger = get_logger(__name__)

class PlivoService:
    def __init__(self):
        logger.info("Initializing PlivoService...")
        self.client = RestClient(
            auth_id=settings.PLIVO_AUTH_ID,
            auth_token=settings.PLIVO_AUTH_TOKEN
        )
        logger.info("PlivoService initialized successfully")

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
            
            logger.info(f"Speaking text on call {call_uuid}")
            logger.debug(f"Text content: {text}")
            logger.debug(f"Voice parameters: voice={voice}, language={language}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    auth=(settings.PLIVO_AUTH_ID, settings.PLIVO_AUTH_TOKEN),
                    json=payload
                )
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"Successfully spoke text on call {call_uuid}")
                logger.debug(f"Speak API response: {result}")
                return result
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error speaking text: {e.response.status_code}")
            logger.error(f"Error response: {e.response.text}")
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
        
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak voice="{voice}" language="{language}">{text}</Speak>
</Response>"""
        
        logger.info(f"Generated speak XML with {len(text)} characters of text")
        logger.debug(f"XML content: {xml}")
        
        # Format XML nicely for logging
        try:
            pretty_xml = xml.dom.minidom.parseString(xml).toprettyxml(indent="  ")
            logger.debug(f"Prettified XML: {pretty_xml}")
        except Exception as e:
            logger.debug(f"Could not prettify XML: {str(e)}")
            
        return xml

    def create_call(self, join_url, to_number=None):
        """Create a new call using Plivo to the dynamic number."""
        try:
            # Use provided to_number or fall back to settings
            target_number = to_number
            
            if not target_number:
                logger.error("No target phone number provided")
                raise ValueError("No target phone number provided (TO_NUMBER)")
                
            logger.info(f"Creating Plivo call to number: {target_number}")
            
            # Create explicit parameters dictionary
            call_params = {
                "from_": settings.PLIVO_PHONE_NUMBER,
                "to_": target_number,
                "answer_url": f"{settings.BASE_URL}/answer_url?join_url={join_url}",
                "answer_method": "POST"
            }
            
            # Log the exact parameters being used
            logger.info(f"Call parameters: {call_params}")
            
            # Create call with explicit parameters
            response = self.client.calls.create(**call_params)
            
            logger.info(f"Call created successfully with request_uuid: {response['request_uuid']}")
            logger.debug(f"Full API response: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Error creating call: {str(e)}")
            raise

    def generate_answer_xml(self, join_url):
        """Generate XML response for answer URL with improved stream settings."""
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Stream
            keepCallAlive="true"
            bidirectional="true"
            contentType="audio/x-l16;rate=16000"
        >
            {join_url}
        </Stream>
    </Response>
    """

        logger.info(f"Generated answer XML with Stream element for join_url")
        logger.debug(f"Join URL: {join_url}")
        
        # Format XML nicely for logging
        try:
            dom = xml.dom.minidom.parseString(xml)
            pretty_xml = dom.toprettyxml(indent="  ")
            logger.debug(f"Prettified XML: {pretty_xml}")
        except Exception as e:
            logger.debug(f"Could not prettify XML: {str(e)}")
            logger.debug(f"Raw XML: {xml}")
            
        return xml