from urllib.request import Request
from flask import Blueprint, request, Response, send_file, current_app, render_template # type: ignore
from app.services.plivo_service import PlivoService
from app.services.ultravox_service import UltravoxService
import logging
import os
import json

logger = logging.getLogger(__name__)
router = Blueprint('ultravox', __name__)

plivo_service = PlivoService()
ultravox_service = UltravoxService()

@router.route("/initiate_call", methods=["GET"])
def initiate_call():
    try:
        logger.info("Creating Ultravox call...")
        ultravox_data = ultravox_service.create_call()
        
        if not isinstance(ultravox_data, dict):
            raise ValueError(f"Unexpected response format: {ultravox_data}")
            
        join_url = ultravox_data.get("joinUrl")
        if not join_url:
            raise ValueError("No joinUrl in response")
            
        logger.info(f"Ultravox joinUrl = {join_url}")

        response = plivo_service.create_call(join_url)
        logger.info("Call initiated with Plivo.")
        logger.info(f"Plivo call request_uuid = {response['request_uuid']}")

        return {
            "message": "Call initiated",
            "plivo_call_uuid": response["request_uuid"]
        }, 200

    except Exception as e:
        logger.exception("Error during initiate_call")
        error_response = Response({"error": str(e)})
        error_response.headers['ngrok-skip-browser-warning'] = 'true'
        return error_response, 500

@router.route("/webhook", methods=["POST"])
def webhook():
    """Handle real-time events from Ultravox and Plivo stream events."""
    try:
        # Check if it's a JSON request (Ultravox event)
        if request.is_json:
            data = request.json
            logger.info(f"Received webhook data: {data}")
            
            # Process Ultravox events
            if "type" in data:
                event_type = data.get("type")
                logger.info(f"Ultravox event type: {event_type}")
                
                if event_type == "transcription":
                    text = data.get("text", "")
                    logger.info(f"User said: {text}")
                    
                    # Create a simple response based on user's text
                    if "hello" in text.lower() or "hi" in text.lower():
                        response_text = "Hello there! How can I help you today?"
                    elif "weather" in text.lower():
                        response_text = "I'm sorry, I don't have access to weather information yet."
                    elif "name" in text.lower():
                        response_text = "My name is Steve, your AI assistant."
                    elif "bye" in text.lower() or "goodbye" in text.lower():
                        response_text = "Goodbye! Have a great day!"
                    else:
                        response_text = "I heard you say: " + text + ". How can I help with that?"
                    
                    # Call Ultravox to speak the response
                    # You need to implement this - use your Ultravox service
                    # ultravox_service.send_speech(response_text)
                    
                    logger.info(f"AI response: {response_text}")
                    
                elif event_type == "call.ended":
                    reason = data.get("reason", "unknown")
                    logger.info(f"Call ended. Reason: {reason}")
            
            return {"status": "success"}, 200
        
        # If it's not JSON, it might be a Plivo stream event
        else:
            form_data = request.form.to_dict()
            logger.info(f"Received form data: {form_data}")
            
            # Process Plivo stream events
            event = form_data.get("event")
            if event:
                logger.info(f"Plivo stream event: {event}")
                
                # For stream.start event, you know audio streaming has begun
                if event == "stream.start":
                    logger.info("Audio streaming has started!")
                # For stream.end event, you know audio streaming has ended
                elif event == "stream.end":
                    logger.info("Audio streaming has ended!")
                    
            return {"status": "success"}, 200
            
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"error": str(e)}, 500

@router.route("/answer_url", methods=["GET", "POST"])
def answer_url():
    """Handle the initial call setup."""
    join_url = request.args.get("join_url", "")
    xml_str = plivo_service.generate_answer_xml(join_url)
    logger.info(f"Plivo XML: {xml_str}")
    return Response(xml_str, mimetype="text/xml")

@router.route("/")
def index():
    return render_template('index.html')

@router.route("/call_status", methods=["POST"])
def call_status():
    """Handle Plivo call status updates."""
    try:
        data = request.form
        logger.info(f"Call status update: {data}")
        return {"status": "success"}, 200
    except Exception as e:
        logger.error(f"Call status error: {str(e)}")
        return {"error": str(e)}, 500 