from dotenv import load_dotenv
import os
import base64
from fastapi import APIRouter, HTTPException, Depends
from google import genai
from google.genai import types
from app.schemas.generate_content import PromptRequest, GenerationResponse
from app.core.security import get_current_hr 

load_dotenv()

try:
    ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    print("Gemini Client initialized successfully.")
except Exception as e:
    print(f"Error initializing Gemini client: {e}. Check GEMINI_API_KEY environment variable.")
    ai_client = None

async def get_ai_client():
    if ai_client is None:
        raise HTTPException(status_code=500, detail="AI service not configured.")
    return ai_client

router = APIRouter(prefix="/generate", tags=["Generations"], dependencies=    [Depends(get_current_hr)])

@router.post("/linkedIn_post", response_model=GenerationResponse)
async def generate_linkedIn_post(
    request: PromptRequest, 
    client: genai.Client = Depends(get_ai_client)
):
    multimodal_prompt = (
        f"Generate a descriptive text caption for a visually interesting scene "
        f"based on the following keywords: '{request.prompt}'. "
        f"The caption should be exactly one paragraph. "
        f"Then, generate an image that perfectly matches that caption. "
        f"Ensure both text and image are generated."
    )

    try:
        config = types.GenerateContentConfig(
            response_modalities=[types.Modality.TEXT, types.Modality.IMAGE], 
            candidate_count=1 
        )
        
        response = await client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=[multimodal_prompt],
            config=config,
        )

        if not response.candidates or not response.candidates[0].content:
            raise HTTPException(status_code=500, detail="Model returned no content.")

        caption = ""
        image_base64 = ""
        
        for part in response.candidates[0].content.parts:
            if part.text:
                caption += part.text.strip()
            elif part.inline_data:
                image_bytes = part.inline_data.data
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')

        if not caption or not image_base64:
             raise HTTPException(status_code=500, detail="Model failed to generate both a caption and an image.")

        return GenerationResponse(caption=caption, image_base64=image_base64)

    except genai.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
