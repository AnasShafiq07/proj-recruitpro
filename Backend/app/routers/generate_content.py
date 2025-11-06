from dotenv import load_dotenv
import os
import base64
from fastapi import APIRouter, HTTPException, Depends
from google import genai
from google.genai import types
# Assuming these schemas are defined in app/schemas/generate_content.py
# and look something like:
# class PromptRequest(BaseModel):
#     prompt: str
# class GenerationResponse(BaseModel):
#     caption: str
#     image_base64: str
from app.schemas.generate_content import PromptRequest, GenerationResponse
from app.core.security import get_current_hr # Assuming this is correctly implemented

load_dotenv()

try:
    # Use the asynchronous client for FastAPI's async functions
    ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY")) 
    print("Gemini Client initialized successfully.")
except Exception as e:
    print(f"Error initializing Gemini client: {e}. Check GEMINI_API_KEY environment variable.")
    ai_client = None

async def get_ai_client():
    if ai_client is None:
        raise HTTPException(status_code=500, detail="AI service not configured.")
    return ai_client

router = APIRouter(prefix="/generate", tags=["Generations"], dependencies=[Depends(get_current_hr)])

# --- NEW/MODIFIED FUNCTION ---
@router.post("/linkedIn_post", response_model=GenerationResponse)
async def generate_linkedIn_post(
    request: PromptRequest, 
    client: genai.Client = Depends(get_ai_client)
):
    # 1. Use a separate model (e.g., Gemini 2.5 Flash) to generate the text caption first.
    caption_prompt = (
        f"Generate a professional, engaging LinkedIn post caption (exactly one paragraph) "
        f"based on the following themes/keywords: '{request.prompt}'. "
        f"The caption should describe a compelling visual scene."
    )
    
    # Model for text generation
    TEXT_MODEL = "gemini-2.5-flash" 
    
    try:
        # Generate the text caption
        text_response = client.models.generate_content(
            model=TEXT_MODEL,
            contents=[caption_prompt],
        )
        
        caption = text_response.text.strip()
        if not caption:
            raise HTTPException(status_code=500, detail="Model failed to generate a caption.")

        # 2. Use the generated caption as the prompt for image generation.
        # Use the dedicated image generation model
        IMAGE_MODEL = "imagen-3.0-generate-002" # Stable model for image generation

        image_config = types.GenerateImagesConfig(
            # Generate exactly one image
            number_of_images=1, 
            # Define aspect ratio suitable for social media
            aspect_ratio="1:1", 
        )

        image_response = client.models.generate_images(
            model=IMAGE_MODEL,
            prompt=caption,
            config=image_config,
        )

        if not image_response.generated_images:
            raise HTTPException(status_code=500, detail="Model returned no generated images.")

        # 3. Process the generated image (the first one)
        generated_image = image_response.generated_images[0]
        image_bytes = generated_image.image.image_bytes
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # NOTE: The image generation model handles the image part; 
        # it typically won't return additional text parts beyond what was requested.
        
        return GenerationResponse(caption=caption, image_base64=image_base64)

    except genai.errors.APIError as e:
        # Catch specific API errors
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {e}")
    except Exception as e:
        # Catch other unexpected errors
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")