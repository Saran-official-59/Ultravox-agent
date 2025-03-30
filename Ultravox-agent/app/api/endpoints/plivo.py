

from fastapi import APIRouter, Request, Depends, Form # type: ignore
from fastapi.responses import PlainTextResponse # type: ignore
from typing import Optional

from app.services.openai_service import generate_ai_response
from app.services.plivo_service import PlivoService
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Dependencies
def get_plivo_service():
    return PlivoService()

@router.post("/webhook", response_class=PlainTextResponse)
async def handle_plivo_webhook(
    request: Request,
    CallUUID: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    Text: Optional[str] = Form(None),
    plivo_service: PlivoService = Depends(get_plivo_service)
):
    """
    Handle Plivo webhook events.
    This endpoint receives events when a call is answered, text is received, etc.
    """
    try:
        logger.info(f"Received Plivo webhook: CallUUID={CallUUID}, From={From}, To={To}")
        
        # If we received speech-to-text
        if Text:
            logger.info(f"Received text from caller: {Text}")
            
            # Generate AI response
            ai_response = await generate_ai_response(
                Text,
                "You are a helpful voice assistant. Keep your responses concise and natural for voice."
            )
            
            # Return Plivo XML to speak the response
            return plivo_service.generate_speak_xml(ai_response)
        
        # Initial answer - welcome message
        welcome_message = await generate_ai_response(
            "Greet the caller and ask how you can help them today.",
            "You are a helpful voice assistant. Keep your responses concise and natural for voice."
        )
        
        return plivo_service.generate_speak_xml(welcome_message)
        
    except Exception as e:
        logger.error(f"Error handling Plivo webhook: {str(e)}")
        # Return a simple response in case of error
        return plivo_service.generate_speak_xml(
            "I'm sorry, I'm having trouble processing your request right now. Please try again later."
        ) 