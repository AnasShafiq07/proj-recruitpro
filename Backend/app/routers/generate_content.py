import os
import base64
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends

from app.schemas.generate_content import PromptRequest, GenerationResponse
from app.core.security import get_current_hr

load_dotenv()

FREEPIK_API_KEY = "FPSX4aa21629431134900c2f280554d91688"
if not FREEPIK_API_KEY:
    raise RuntimeError("Missing FREEPIK_API_KEY")

router = APIRouter(
    prefix="/generate",
    tags=["Generations"],
    dependencies=[Depends(get_current_hr)]
)

FREEPIK_IMAGE_URL = "https://api.freepik.com/v1/ai/text-to-image/imagen3"

@router.post("/linkedin_post", response_model=GenerationResponse)
async def generate_linkedin_post(request: PromptRequest):
    """
    request.prompt: user-provided text to describe the visual scene / caption
    """

    headers = {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Content-Type": "application/json"
    }

    image_payload = {
    "prompt": request.prompt,
    "negative_prompt": "blurry, distorted, watermark, text overlay, bad composition",
    "image": {"size": "square_1_1"},
    "num_images": 1
    }

    try:
        img_response = requests.post(FREEPIK_IMAGE_URL, json=image_payload, headers=headers, timeout=60)
        if img_response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Freepik Image Error: {img_response.text}")

        data = img_response.json()["data"][0]
        image_url = data["url"]

        img_bytes = requests.get(image_url).content
        image_base64 = base64.b64encode(img_bytes).decode()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {e}")

    # Return the prompt as "caption" since Freepik cannot generate text
    return GenerationResponse(caption=request.prompt, image_base64=image_base64)


@router.post("/send-offer-letter")
async def send_offer_letter(request: PromptRequest):
    return True