# Ultravox Voice Agent

A voice agent application that integrates with Plivo and UltraVox services for making automated phone calls.

## Prerequisites

- Python 3.8 or higher
- ngrok (for local development)
- Plivo account and credentials
- UltraVox account and credentials
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Saran-official-59/Ultravox-agent.git
cd Ultravox-agent
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```bash
cp .env.example .env
```

5. Update the `.env` file with your credentials:
```
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Plivo Configuration
PLIVO_AUTH_ID=your_plivo_auth_id
PLIVO_AUTH_TOKEN=your_plivo_auth_token
PLIVO_PHONE_NUMBER=your_plivo_phone_number

# UltraVox Configuration
ULTRAVOX_API_KEY=your_ultravox_api_key
ULTRAVOX_PHONE_NUMBER=your_ultravox_phone_number

# Application Configuration
LOG_LEVEL=INFO
```

## Running the Application

1. Start ngrok to create a public URL:
```bash
ngrok http 5000
```

2. Update the `BASE_URL` in your `.env` file with the ngrok URL you received.

3. Start the server:
```bash
python main.py 
or python wsgi.py
```

4. Test the application by making a curl request:
```bash
curl [your-ngrok-url]/initiate_call
```

Replace `[your-ngrok-url]` with your actual ngrok URL (e.g., `https://abc123.ngrok.io`).

## API Endpoints

- `POST /initiate_call`: Initiates a phone call using the configured services

## Configuration

Make sure to update all the required environment variables in the `.env` file:
- OpenAI API key for AI capabilities
- Plivo credentials for phone call functionality
- UltraVox credentials for additional services
- Appropriate log level for debugging

## Troubleshooting

If you encounter any issues:
1. Check that all environment variables are properly set
2. Verify that ngrok is running and accessible
3. Ensure your Plivo and UltraVox accounts are active
4. Check the application logs for detailed error messages

## License

This project uses the following third-party services:

### Plivo License
This project uses Plivo's services under their [Terms of Service](https://www.plivo.com/terms-of-service/) and [Privacy Policy](https://www.plivo.com/privacy-policy/). Plivo's services are subject to their [Acceptable Use Policy](https://www.plivo.com/acceptable-use-policy/).

### UltraVox License
This project uses UltraVox's services under their [Terms of Service](https://www.ultravox.ai/terms) and [Privacy Policy](https://www.ultravox.ai/privacy). UltraVox's services are subject to their [Acceptable Use Policy](https://www.ultravox.ai/acceptable-use).
