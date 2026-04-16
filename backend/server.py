import os
import json
import uuid
import base64
import tempfile
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

app = FastAPI(title="Tilt API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")


class DecisionRequest(BaseModel):
    input_text: str
    context: Optional[str] = None
    user_preference: Optional[str] = None
    tone_traits: Optional[list] = None


class DecisionResponse(BaseModel):
    safe: dict
    smart: dict
    bold: dict
    reasoning: dict


class ScreenAnalysisRequest(BaseModel):
    image_base64: str


class ScreenAnalysisResponse(BaseModel):
    context: str
    activity: str


class ChatMessage(BaseModel):
    role: str
    content: str


class AssistRequest(BaseModel):
    message: str
    screen_context: Optional[str] = None
    conversation: Optional[list] = None
    mode: Optional[str] = "chat"
    user_preference: Optional[str] = None
    tone_traits: Optional[list] = None


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/analyze-screen")
async def analyze_screen(request: ScreenAnalysisRequest):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    try:
        image_data = request.image_base64
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        session_id = f"tilt-vision-{uuid.uuid4().hex[:8]}"

        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message="You analyze screenshots to understand user context. Respond with ONLY valid JSON, no markdown.",
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        image_content = ImageContent(image_base64=image_data)

        user_message = UserMessage(
            text="""Analyze this screenshot. Describe in 1-2 concise sentences:
1. What application or website the user is on
2. What content they are viewing or working on
3. What action they might need help with

Respond as JSON only:
{"context": "1-2 sentence description of what user is doing", "activity": "one word like Email, Code, Chat, Document, Browse, Social, Calendar, Shopping"}""",
            file_contents=[image_content],
        )

        raw_response = await chat.send_message(user_message)

        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        result = json.loads(cleaned)
        return ScreenAnalysisResponse(
            context=result.get("context", "Unable to analyze screen"),
            activity=result.get("activity", "Unknown"),
        )

    except json.JSONDecodeError:
        return ScreenAnalysisResponse(
            context="Screen captured but analysis unclear",
            activity="Unknown",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screen analysis failed: {str(e)}")


@app.post("/api/assist")
async def assist(request: AssistRequest):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    screen_info = ""
    if request.screen_context:
        screen_info = f"\n\n[SCREEN CONTEXT — what the user is currently looking at]\n{request.screen_context}"

    preference_info = ""
    if request.user_preference:
        preference_info = f"\nUser's preferred communication style: {request.user_preference}."
    if request.tone_traits and len(request.tone_traits) > 0:
        preference_info += f" Tone traits: {', '.join(request.tone_traits)}."

    system_prompt = f"""You are Tilt — an AI assistant that sees the user's screen and helps them get things done.

You are like a smart coworker looking over their shoulder. You can see what they're working on via screen context.{screen_info}

Your job:
- Help the user with whatever they're doing right now
- Be concise, actionable, and direct (2-5 sentences max)
- If they're writing something (email, message, document), help draft or improve it
- If they're stuck on a task, give clear next steps
- If they ask how to respond to something, give them the best response they can copy-paste
- Don't be generic — use the screen context to be specific and useful
- You can reference what you see on their screen naturally{preference_info}

Write like a sharp, helpful coworker. No fluff, no corporate jargon. Be real."""

    session_id = f"tilt-assist-{uuid.uuid4().hex[:8]}"

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        # Build conversation context
        conv_context = ""
        if request.conversation and len(request.conversation) > 0:
            recent = request.conversation[-6:]  # last 3 exchanges
            for msg in recent:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    conv_context += f"\nUser: {content}"
                else:
                    conv_context += f"\nAssistant: {content}"

        user_text = request.message
        if conv_context:
            user_text = f"Previous conversation:{conv_context}\n\nUser's new message: {request.message}"

        user_message = UserMessage(text=user_text)
        response = await chat.send_message(user_message)

        return {"response": response.strip(), "mode": "chat"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assist failed: {str(e)}")


@app.post("/api/generate-decisions")
async def generate_decisions(request: DecisionRequest):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    preference_context = ""
    if request.user_preference:
        preference_context = f"\nUser's preferred decision style: {request.user_preference}. Bias outputs slightly toward this style but keep meaningful variation between all three options."

    tone_context = ""
    if request.tone_traits and len(request.tone_traits) > 0:
        tone_context = f"\nUser's tone traits: {', '.join(request.tone_traits)}. Incorporate these traits naturally."

    screen_context = ""
    if request.context:
        screen_context = f"\nContext from user's current activity: {request.context}"

    system_prompt = """You are Tilt — a decision intelligence engine. You help users craft better responses and make sharper decisions.

You generate exactly 3 response options for any given situation:
- SAFE: Polite, low-risk, conservative. Avoids conflict. Professional but careful.
- SMART: Clear, balanced, confident. The recommended middle ground. Direct but diplomatic.
- BOLD: Assertive, high-conviction, direct. Takes a strong stance. No hedging.

Rules:
- Each option MUST be distinctly different in tone and approach
- Responses must be concise (2-4 sentences max each)
- Write like a modern professional — no corporate jargon, no fluff
- Responses must be immediately usable (copy-paste ready)
- Generate a 1-line "why this works" reasoning for each option

You MUST respond with valid JSON only. No markdown, no explanation outside JSON.

Response format:
{
  "safe": {
    "response": "the safe response text",
    "label": "Safe",
    "description": "polite, low risk"
  },
  "smart": {
    "response": "the smart response text",
    "label": "Smart",
    "description": "clear, balanced"
  },
  "bold": {
    "response": "the bold response text",
    "label": "Bold",
    "description": "direct, assertive"
  },
  "reasoning": {
    "safe": "1-line why the safe option works",
    "smart": "1-line why the smart option works",
    "bold": "1-line why the bold option works"
  }
}"""

    user_prompt = f"Situation/message to respond to:\n\"{request.input_text}\"{screen_context}{preference_context}{tone_context}\n\nGenerate the 3 decision options as JSON."

    session_id = f"tilt-{uuid.uuid4().hex[:8]}"

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        user_message = UserMessage(text=user_prompt)
        raw_response = await chat.send_message(user_message)

        # Parse the JSON response
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        result = json.loads(cleaned)

        return DecisionResponse(
            safe=result.get("safe", {}),
            smart=result.get("smart", {}),
            bold=result.get("bold", {}),
            reasoning=result.get("reasoning", {}),
        )

    except json.JSONDecodeError:
        # Fallback: try GPT-5.2
        try:
            chat_fallback = LlmChat(
                api_key=EMERGENT_KEY,
                session_id=f"tilt-fb-{uuid.uuid4().hex[:8]}",
                system_message=system_prompt,
            ).with_model("openai", "gpt-5.2")

            user_message = UserMessage(text=user_prompt)
            raw_response = await chat_fallback.send_message(user_message)

            cleaned = raw_response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()

            result = json.loads(cleaned)
            return DecisionResponse(
                safe=result.get("safe", {}),
                smart=result.get("smart", {}),
                bold=result.get("bold", {}),
                reasoning=result.get("reasoning", {}),
            )
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {str(e2)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
