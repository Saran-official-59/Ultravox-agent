import os
import logging
from flask import Flask # type: ignore
from app.api.endpoints.ultravox import router as ultravox_router
from app.core.config import settings

# Setup Flask with correct template folder
app = Flask(__name__, 
    template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'templates'))
app.register_blueprint(ultravox_router)

# Logging Configuration
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)


"""curl -X POST http://localhost:8000/api/v1/ultravox/calls \
-H "Content-Type: application/json" \
-d '{
    "to_number": "+919566848434",
    "system_prompt": "You are a helpful assistant",
    "inactivity_messages": ["Are you still there?"],
    "initial_messages": ["Hello! How can I help you today?"]
}' """