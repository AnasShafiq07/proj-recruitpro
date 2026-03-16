import json
import os
import logging
from mcp import ClientSession
from mcp.client.sse import sse_client
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Himalayas SSE endpoint
HIMALAYAS_URL = "https://mcp.himalayas.app/sse"

async def fetch_candidates_from_himalayas(search_query: str):
    """
    Sourcing service that retrieves real data from Himalayas MCP 
    and structures it using Gemini 2.5/3.
    """
    candidates = []
    raw_data_text = ""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY is missing from .env")
        return []

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')

    try:
        async with sse_client(HIMALAYAS_URL) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                
                response = await session.call_tool(
                    "search_talent", 
                    arguments={"keyword": search_query}
                )

                raw_data_text = "".join([
                    item.text for item in response.content 
                    if hasattr(item, 'text')
                ])
                print(raw_data_text)

        if raw_data_text.strip():
            prompt = f"""
                I have retrieved the following raw talent data from a sourcing tool.
                Convert this data into a structured JSON array.
                RULES:
                1. Each object MUST have keys: "name", "title", "location", "skills" (array), "gmail".
                2. If "gmail" is missing from the data, generate a realistic placeholder based on their name (e.g. john.doe@gmail.com).
                3. Keep the "name", "title", and "skills" as accurate to the source as possible.
                4. Return ONLY the raw JSON array. No markdown fences.
                SOURCE DATA:

                {raw_data_text}"""

            ai_response = model.generate_content(prompt)
            content = ai_response.text.strip()

            if "```" in content:
                content = content.split("```")[1].replace("json", "").strip()

            parsed = json.loads(content)
            
            if isinstance(parsed, list):
                candidates = parsed

    except* Exception as eg:
        for error in eg.exceptions:
            logger.error(f"MCP Connection/TaskGroup Error: {error}")
            

    return candidates