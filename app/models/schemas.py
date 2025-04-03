from pydantic import BaseModel, Field # type: ignore
from typing import List, Optional, Dict, Any
from enum import Enum

class MessageRole(str, Enum):
    USER = "MESSAGE_ROLE_USER"
    AGENT = "MESSAGE_ROLE_AGENT"

class InactivityMessage(BaseModel):
    text:str

class Message(BaseModel):
    text: str

class UltravoxWebhookRequest(BaseModel):
    event: str
    call_id: str
    from_number: str = Field(..., alias="from")
    to_number: str = Field(..., alias="to")
    
    class Config:
        populate_by_name = True

class PlivoWebhookRequest(BaseModel):
    call_uuid: str = Field(..., alias="CallUUID")
    from_number: str = Field(..., alias="From")
    to_number: str = Field(..., alias="To")
    
    class Config:
        populate_by_name = True

class CreateCallRequest(BaseModel):
    to_number: str
    from_number: str
    system_prompt: str = """
    You are Steve, an AI assistant having a phone conversation. 
    - Listen carefully to the user's questions and respond naturally
    - Keep your responses concise and conversational
    - Ask follow-up questions to maintain engagement
    - If you don't understand something, ask for clarification
    - End responses with a question when appropriate to keep the conversation flowing
    """
    inactivity_messages: Optional[List[InactivityMessage]] = None
    initial_messages: Optional[List[Message]] = None
    
class CallResponse(BaseModel):
    call_id: str    
    status: str 