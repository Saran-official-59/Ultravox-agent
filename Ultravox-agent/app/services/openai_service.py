import openai # type: ignore
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

async def generate_ai_response(prompt: str, system_prompt: str = "You are a helpful voice assistant.") -> str:
    """
    Generate an AI response using OpenAI's GPT model.
    
    Args:
        prompt: The user's input prompt
        system_prompt: The system prompt to guide the AI's behavior
        
    Returns:
        The AI-generated response text
    """
    try:
        logger.info(f"Generating AI response for prompt: {prompt[:50]}...")
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        
        ai_text = response.choices[0].message.content
        logger.info(f"Generated AI response: {ai_text[:50]}...")
        
        return ai_text
    
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        return "I'm sorry, I'm having trouble processing your request right now." 