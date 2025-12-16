import os
import base64
import requests
import json
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.schemas.generate_content import PromptRequest, GenerationResponse
from app.core.security import get_current_hr
from app.db.models import HRManager

load_dotenv()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter(
    prefix="/generate",
    tags=["Generations"],
    dependencies=[Depends(get_current_hr)]
)

client = None
if GOOGLE_API_KEY:
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
    except Exception as e:
        print(f"Error initializing Google Client: {e}")

class ContentPlan(BaseModel):
    caption: str
    visual_image_prompt: str

def generate_with_pollinations(prompt: str) -> str:
    """
    Generates an image using Pollinations.ai based on a refined prompt.
    Returns Base64 string of the image.
    """
    try:
        clean_prompt = requests.utils.quote(prompt)
        
        url = f"https://image.pollinations.ai/prompt/{clean_prompt}?model=flux&width=1024&height=1024&nologo=true"
        
        #print(f"Calling Pollinations: {url}")
        response = requests.get(url, timeout=45)
        
        if response.status_code == 200:
            return base64.b64encode(response.content).decode('utf-8')
        print(f"Pollinations Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Pollinations Exception: {e}")
    return None

@router.post("/linkedin_post", response_model=GenerationResponse)
async def generate_linkedin_post(request: PromptRequest):
    """
    Flow:
    1. Receives Candidate Requirements from User (request.prompt).
    2. Uses Gemini to generate a structured JSON containing:
       - The LinkedIn Caption text.
       - A separate, highly visual prompt optimized for image generation.
    3. Uses Pollinations.ai to generate the image using the visual prompt from step 2.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Google AI Client not initialized properly.")

    generated_caption = None
    visual_prompt_for_pollinations = None
    image_base64 = None
    
    system_instruction = """
    You are an expert HR Marketing Specialist and Creative Director.
    The user will provide a list of 'candidate requirements' for a job opening.
    
    Your task is to generate a JSON object with exactly two fields based on these requirements:
    1. "caption": A professional, engaging LinkedIn post announcing this role. Include relevant emojis and 3-5 targeted hashtags.
    2. "visual_image_prompt": A detailed, purely visual description suitable for an AI image generator to create a professional recruiting image representing this role. 
       - Focus on the setting, atmosphere, and symbolic elements relevant to the job (e.g., "A sleek modern desk with three monitors displaying data charts in a sunlit high-rise office" for a data analyst).
       - Do NOT include any text, words, or logos inside the visual description itself.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash', 
            contents=request.prompt, 
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ContentPlan
            )
        )
        
        content_plan_data = json.loads(response.text)
        generated_caption = content_plan_data.get("caption")
        visual_prompt_for_pollinations = content_plan_data.get("visual_image_prompt")

        # print(f"Gemini Generated Caption: {generated_caption[:50]}...")
        # print(f"Gemini Generated Visual Prompt: {visual_prompt_for_pollinations}")

    except Exception as e:
        print(f"Gemini Text Generation Failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate caption logic with Gemini: {str(e)}")

    if visual_prompt_for_pollinations:
        #print("Starting Pollinations generation...")
        image_base64 = generate_with_pollinations(visual_prompt_for_pollinations)
    else:
         raise HTTPException(status_code=500, detail="Pollinations failed to generate a visual prompt specifically for the image.")

    if not image_base64:
        raise HTTPException(status_code=500, detail="Image generation failed via Pollinations.ai.")

    return GenerationResponse(
        caption="generated_caption", 
        image_base64=image_base64
    )


@router.post("/send-offer-letter")
async def send_offer_letter(request: PromptRequest):
    # logic for sending offer letter
    return True