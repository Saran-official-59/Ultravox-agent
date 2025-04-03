from flask import Blueprint, request, Response, jsonify, render_template # type: ignore
from app.services.plivo_service import PlivoService
from app.services.ultravox_service import UltravoxService
from app.core.config import settings
import logging
import json
import time

logger = logging.getLogger(__name__)
router = Blueprint('ultravox', __name__)

plivo_service = PlivoService()
ultravox_service = UltravoxService()

# Index page route
@router.route("/", methods=["GET"])
def index():
    """Render the home page with call button."""
    logger.info("Rendering index page")
    return render_template("index.html")

@router.route("/initiate_call", methods=["GET", "POST"])
def initiate_call():
    """
    Initiate a call with dynamic number handling.
    Can be called via GET or POST, and can accept to_number parameter.
    """
    start_time = time.time()
    logger.info("Call initiation requested")
    
    # Extract to_number from query parameters, form, or JSON body
    to_number = None
    if request.method == "POST":
        if request.is_json:
            to_number = request.json.get("to_number")
        else:
            to_number = request.form.get("to_number")
    else:  # GET
        to_number = request.args.get("to_number")
    
    # Use the provided number or fall back to settings
    target_number = to_number or settings.TO_NUMBER
    
    logger.info(f"Target phone number: {target_number}")
    
    try:
        logger.info("Creating Ultravox call...")
        ultravox_data = ultravox_service.create_call()
        
        if not isinstance(ultravox_data, dict):
            logger.error(f"Unexpected response format: {ultravox_data}")
            raise ValueError(f"Unexpected response format: {ultravox_data}")
            
        join_url = ultravox_data.get("joinUrl")
        if not join_url:
            logger.error("No joinUrl in Ultravox response")
            raise ValueError("No joinUrl in response")
            
        logger.info(f"Ultravox joinUrl retrieved successfully")
        logger.debug(f"Join URL: {join_url}")

        plivo_response = plivo_service.create_call(join_url, to_number=target_number)
        logger.info(f"Call initiated with Plivo, request_uuid={plivo_response['request_uuid']}")

        # Calculate processing time
        elapsed_time = time.time() - start_time
        logger.info(f"Call initiation completed in {elapsed_time:.2f} seconds")

        return {
            "message": "Call initiated successfully",
            "plivo_call_uuid": plivo_response["request_uuid"],
            "to_number": settings.TO_NUMBER,
            "elapsed_time": f"{elapsed_time:.2f}s"
        }, 200

    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.exception(f"Error during initiate_call (after {elapsed_time:.2f}s)")
        return {"error": str(e), "elapsed_time": f"{elapsed_time:.2f}s"}, 500

@router.route("/webhook", methods=["POST"])
def webhook():
    """Handle real-time events from Ultravox and Plivo stream events."""
    try:
        # Track processing time
        start_time = time.time()
        logger.info("Webhook event received")
        
        # Check if it's a JSON request (Ultravox event)
        if request.is_json:
            data = request.json
            logger.info(f"Received webhook data (JSON)")
            logger.debug(f"Webhook JSON data: {json.dumps(data, indent=2)}")
            
            # Process Ultravox events
            if "type" in data:
                event_type = data.get("type")
                logger.info(f"Ultravox event type: {event_type}")
                
                if event_type == "transcription":
                    text = data.get("text", "")
                    logger.info(f"User said: {text}")
                    
                    # Get response templates
                    templates = settings.get_response_templates()
                    
                    # Create a response based on user's text
                    lower_text = text.lower()
                    if any(greeting in lower_text for greeting in ["hello", "hi", "hey"]):
                        response_text = templates["greeting"]
                    elif "weather" in lower_text:
                        response_text = templates["weather"]
                    elif "name" in lower_text:
                        response_text = templates["name"]
                    elif any(bye in lower_text for bye in ["bye", "goodbye", "see you"]):
                        response_text = templates["goodbye"]
                    else:
                        response_text = templates["default"].format(text=text)
                    
                    logger.info(f"AI response: {response_text}")
                    
                elif event_type == "call.ended":
                    reason = data.get("reason", "unknown")
                    logger.info(f"Call ended. Reason: {reason}")
            
            # Calculate and log processing time
            elapsed_time = time.time() - start_time
            logger.info(f"Webhook processed in {elapsed_time:.2f} seconds")
            return {"status": "success", "processing_time": f"{elapsed_time:.2f}s"}, 200
        
        # If it's not JSON, it might be a Plivo stream event
        else:
            form_data = request.form.to_dict()
            logger.info(f"Received form data webhook")
            logger.debug(f"Form data: {form_data}")
            
            # Process Plivo stream events
            event = form_data.get("event")
            if event:
                logger.info(f"Plivo stream event: {event}")
                
                if event == "stream.start":
                    logger.info("Audio streaming has started!")
                elif event == "stream.end":
                    logger.info("Audio streaming has ended!")
                    
            # Calculate and log processing time
            elapsed_time = time.time() - start_time
            logger.info(f"Form webhook processed in {elapsed_time:.2f} seconds")
            return {"status": "success", "processing_time": f"{elapsed_time:.2f}s"}, 200
            
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"error": str(e)}, 500

@router.route("/answer_url", methods=["GET", "POST"])
def answer_url():
    """Handle the initial call setup."""
    try:
        start_time = time.time()
        logger.info("Answer URL called")
        
        # Get join URL from query parameters
        join_url = request.args.get("join_url", "")
        if not join_url:
            logger.error("No join_url provided in answer_url request")
            return Response("Error: No join URL provided", status=400)
            
        logger.info(f"Generating answer XML for join URL")
        logger.debug(f"Join URL: {join_url}")
        
        # Generate XML response
        xml_str = plivo_service.generate_answer_xml(join_url)
        
        # Calculate processing time
        elapsed_time = time.time() - start_time
        logger.info(f"Answer URL processed in {elapsed_time:.2f} seconds")
        
        return Response(xml_str, mimetype="text/xml")
    except Exception as e:
        logger.error(f"Error in answer_url: {str(e)}")
        return Response(f"<Response><Speak>Error: {str(e)}</Speak></Response>", 
                     mimetype="text/xml")

@router.route("/call_status", methods=["POST"])
def call_status():
    """Handle Plivo call status updates."""
    try:
        start_time = time.time()
        data = request.form.to_dict()
        logger.info(f"Call status update received")
        logger.debug(f"Call status data: {data}")
        
        # Extract useful status information
        call_uuid = data.get("CallUUID", "unknown")
        call_status = data.get("CallStatus", "unknown")
        
        logger.info(f"Call {call_uuid} status: {call_status}")
        
        # Calculate processing time
        elapsed_time = time.time() - start_time
        logger.info(f"Call status processed in {elapsed_time:.2f} seconds")
        
        return {"status": "success", "call_status": call_status}, 200
    except Exception as e:
        logger.error(f"Call status error: {str(e)}")
        return {"error": str(e)}, 500 