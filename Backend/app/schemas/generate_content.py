from pydantic import BaseModel

class PromptRequest(BaseModel):
    prompt: str

class GenerationResponse(BaseModel):
    caption: str
    image_base64: str 