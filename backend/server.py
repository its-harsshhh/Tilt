import os
import json
import uuid
import base64
import tempfile
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech

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
    modifier: Optional[str] = None
    previous_response: Optional[str] = None


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


class GuideStepRequest(BaseModel):
    image_base64: str
    task: str
    completed_steps: Optional[list] = []
    step_number: Optional[int] = 1


class TiltRequest(BaseModel):
    message: str
    image_base64: Optional[str] = None
    screen_context: Optional[str] = None
    conversation: Optional[list] = None
    user_preference: Optional[str] = None
    tone_traits: Optional[list] = None
    guide_active: Optional[bool] = False
    guide_task: Optional[str] = None
    completed_steps: Optional[list] = []
    step_number: Optional[int] = 1


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    try:
        stt = OpenAISpeechToText(api_key=EMERGENT_KEY)
        audio_bytes = await file.read()

        # Write to temp file with correct extension
        suffix = ".webm"
        if file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "webm"
            if ext in ("mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"):
                suffix = f".{ext}"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            response = await stt.transcribe(
                file=audio_file,
                model="whisper-1",
                response_format="json",
            )

        os.unlink(tmp_path)
        return {"text": response.text, "status": "ok"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = "nova"


@app.post("/api/speak")
async def speak_text(request: SpeakRequest):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_KEY)
        audio_b64 = await tts.generate_speech_base64(
            text=request.text.strip()[:4096],
            model="tts-1",
            voice=request.voice or "nova",
            speed=1.1,
        )
        return {"audio_base64": audio_b64, "status": "ok"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")


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
            text="""Analyze this screenshot. IGNORE any small floating windows, overlays, popups, or picture-in-picture panels — focus ONLY on the main application or website content underneath.

Describe in 1-2 concise sentences:
1. What application or website the user is on
2. What content they are viewing or working on
3. What action they might need help with

Respond as JSON only:
{"context": "1-2 sentence description of what user is doing on the MAIN screen", "activity": "one word like Email, Code, Chat, Document, Browse, Social, Calendar, Shopping"}""",
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


@app.post("/api/tilt")
async def tilt_unified(request: TiltRequest):
    """Unified Tilt endpoint: auto-detects if user needs chat help or step-by-step guidance."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    # If guide is already active, continue guiding
    if request.guide_active and request.image_base64:
        return await _guide_step(
            request.image_base64,
            request.guide_task or request.message,
            request.completed_steps or [],
            request.step_number or 1,
        )

    # If we have a screenshot, classify intent: does user need guidance or chat?
    has_image = request.image_base64 and len(request.image_base64) > 100

    if has_image:
        # Use a quick classification to determine if this is a guidance request
        needs_guide = _is_guidance_request(request.message)
        if needs_guide:
            return await _guide_step(
                request.image_base64,
                request.message,
                [],
                1,
            )

    # Default: conversational assist
    return await _chat_assist(request)


def _is_guidance_request(message: str) -> bool:
    """Heuristic: detect if the user is asking for step-by-step guidance."""
    msg = message.lower().strip()
    guide_triggers = [
        "how do i ", "how to ", "show me how", "guide me", "help me ",
        "walk me through", "take me to", "where do i ", "where is ",
        "i want to ", "i need to ", "can you show", "navigate to",
        "delete this", "create a ", "set up ", "configure ", "change the",
        "update the", "remove the", "add a ", "open the", "find the",
        "go to ", "click on", "enable ", "disable ", "turn on", "turn off",
    ]
    return any(msg.startswith(t) or t in msg for t in guide_triggers)


async def _chat_assist(request: TiltRequest):
    """Conversational AI response."""
    screen_info = ""
    if request.screen_context:
        screen_info = f"\n\n[SCREEN CONTEXT — what the user is currently looking at]\n{request.screen_context}"

    preference_info = ""
    if request.user_preference:
        preference_info = f"\nUser's preferred communication style: {request.user_preference}."
    if request.tone_traits and len(request.tone_traits) > 0:
        preference_info += f" Tone traits: {', '.join(request.tone_traits)}."

    system_prompt = f"""You are Tilt — an AI assistant that sees the user's screen and helps them get things done.{screen_info}

Your job:
- Help the user with whatever they're doing right now
- Be concise, actionable, and direct (2-5 sentences max)
- If they're writing something, help draft or improve it
- If they're stuck, give clear next steps
- If they ask how to respond, give a copy-paste ready response
- Use screen context to be specific{preference_info}

Write like a sharp coworker who respects your time. Clear and direct — no filler, no hedging. Start with the answer. Short sentences. Never say "I think" or "perhaps". Just say it."""

    session_id = f"tilt-chat-{uuid.uuid4().hex[:8]}"

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        conv_context = ""
        if request.conversation and len(request.conversation) > 0:
            for msg in request.conversation[-6:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                conv_context += f"\n{'User' if role == 'user' else 'Assistant'}: {content}"

        user_text = request.message
        if conv_context:
            user_text = f"Previous conversation:{conv_context}\n\nUser's new message: {request.message}"

        user_message = UserMessage(text=user_text)
        response = await chat.send_message(user_message)

        return {"type": "chat", "response": response.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


async def _guide_step(image_base64: str, task: str, completed_steps: list, step_number: int):
    """Step-by-step screen guidance with annotated region."""
    image_data = image_base64
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    steps_context = ""
    if completed_steps and len(completed_steps) > 0:
        steps_context = "\n\nSteps already completed:\n" + "\n".join(
            [f"- Step {i+1}: {s}" for i, s in enumerate(completed_steps)]
        )

    session_id = f"tilt-guide-{uuid.uuid4().hex[:8]}"

    system_prompt = """You are Tilt — a real-time screen guide. You look at the user's screen and guide them step-by-step.

You MUST respond with valid JSON only. No markdown outside JSON.

For each step:
1. Look at the current screenshot carefully
2. Determine what the user needs to do NEXT (one single action)
3. Identify the exact UI element to interact with
4. Provide approximate location as normalized coordinates (0 to 1, 0,0 is top-left, 1,1 is bottom-right)

IMPORTANT: Ignore any small floating windows, overlays or picture-in-picture panels in the screenshot. Focus on the MAIN application content.

Response format:
{
  "instruction": "Clear, concise instruction (e.g., 'Click the Settings tab')",
  "detail": "Brief explanation of why",
  "region": { "x": 0.85, "y": 0.05, "label": "Settings" },
  "is_complete": false,
  "step_summary": "Short label (e.g., 'Open Settings')"
}

Rules:
- ONE action at a time
- Be specific about which UI element
- region x=horizontal (0=left, 1=right), y=vertical (0=top, 1=bottom)
- is_complete=true ONLY when entire task is finished"""

    user_prompt = f"""Task: "{task}"
Step: {step_number}{steps_context}

Look at the screenshot and tell the user the NEXT single action."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        image_content = ImageContent(image_base64=image_data)
        user_message = UserMessage(text=user_prompt, file_contents=[image_content])
        raw_response = await chat.send_message(user_message)

        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        result = json.loads(cleaned)
        return {
            "type": "guide",
            "instruction": result.get("instruction", ""),
            "detail": result.get("detail", ""),
            "region": result.get("region", {"x": 0.5, "y": 0.5, "label": ""}),
            "is_complete": result.get("is_complete", False),
            "step_summary": result.get("step_summary", f"Step {step_number}"),
            "step_number": step_number,
        }

    except json.JSONDecodeError:
        return {
            "type": "guide",
            "instruction": "Could not determine the next step. Try describing the task again.",
            "detail": "",
            "region": {"x": 0.5, "y": 0.5, "label": ""},
            "is_complete": False,
            "step_summary": f"Step {step_number}",
            "step_number": step_number,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Guide failed: {str(e)}")


@app.post("/api/guide-step")
async def guide_step(request: GuideStepRequest):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    try:
        image_data = request.image_base64
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        steps_context = ""
        if request.completed_steps and len(request.completed_steps) > 0:
            steps_context = "\n\nSteps already completed:\n" + "\n".join(
                [f"- Step {i+1}: {s}" for i, s in enumerate(request.completed_steps)]
            )

        session_id = f"tilt-guide-{uuid.uuid4().hex[:8]}"

        system_prompt = """You are Tilt — a real-time screen guide. You look at the user's screen and guide them through a task step-by-step.

You MUST respond with valid JSON only. No markdown, no explanation outside JSON.

For each step:
1. Look at the current screenshot carefully
2. Determine what the user needs to do NEXT (one single action)
3. Identify the exact UI element they need to interact with
4. Provide the approximate location of that element as normalized coordinates (0 to 1, where 0,0 is top-left and 1,1 is bottom-right)

Response format:
{
  "instruction": "Clear, concise instruction for what to do next (e.g., 'Click the Settings tab in the top navigation bar')",
  "detail": "Brief explanation of why this step is needed",
  "region": {
    "x": 0.85,
    "y": 0.05,
    "label": "Settings"
  },
  "is_complete": false,
  "step_summary": "Short label for this step (e.g., 'Open Settings')"
}

Rules:
- Give ONE action at a time — never multiple steps
- Be very specific about which UI element to interact with
- The region coordinates should point to the CENTER of the target element
- x is horizontal (0=left, 1=right), y is vertical (0=top, 1=bottom)
- Set is_complete to true ONLY when the entire task is finished
- If you can see the task is already done in the screenshot, set is_complete to true"""

        user_prompt = f"""Task the user wants to accomplish: "{request.task}"

Current step number: {request.step_number}{steps_context}

Look at the screenshot and tell the user the NEXT single action to take. Identify where on the screen they need to click/interact."""

        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        image_content = ImageContent(image_base64=image_data)
        user_message = UserMessage(text=user_prompt, file_contents=[image_content])
        raw_response = await chat.send_message(user_message)

        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        result = json.loads(cleaned)
        return {
            "instruction": result.get("instruction", ""),
            "detail": result.get("detail", ""),
            "region": result.get("region", {"x": 0.5, "y": 0.5, "label": ""}),
            "is_complete": result.get("is_complete", False),
            "step_summary": result.get("step_summary", f"Step {request.step_number}"),
            "step_number": request.step_number,
        }

    except json.JSONDecodeError:
        return {
            "instruction": "Could not determine the next step. Please try describing the task again.",
            "detail": "",
            "region": {"x": 0.5, "y": 0.5, "label": ""},
            "is_complete": False,
            "step_summary": f"Step {request.step_number}",
            "step_number": request.step_number,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Guide step failed: {str(e)}")


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

Write like a sharp coworker who respects your time. Clear and direct — no filler, no hedging. Start with the answer. Short sentences. Never say "I think" or "perhaps" or "you might want to". Just say it."""

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

You also provide INSIGHTS to help the user think deeper:
- trade_offs: 1 line per option explaining the risk/reward
- blind_spots: 1 sentence about what the user might be missing
- recommendation: 1 sentence actionable advice on what to do now

Rules:
- Each option MUST be distinctly different in tone and approach
- Responses must be concise (2-4 sentences max each)
- Be clear and direct. No filler words, no "I think", no "perhaps"
- Start each response with the action or answer, not context
- Short sentences. One idea per sentence. No hedging.
- Responses must be immediately usable (copy-paste ready)
- Insights must be sharp — max 1 line each. No fluff.

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
  },
  "insights": {
    "trade_offs": {
      "safe": "low risk, may sound passive",
      "smart": "balanced, most effective",
      "bold": "strong impact, might feel pushy"
    },
    "blind_spots": "One sentence about what the user might be overlooking",
    "recommendation": "One sentence — what to do right now"
  }
}"""

    modifier_context = ""
    if request.modifier:
        modifier_context = f"\n\nThe user wants to refine the output. Modifier: \"{request.modifier}\""
        if request.previous_response:
            modifier_context += f"\nPrevious response they selected: \"{request.previous_response}\"\nApply the modifier to improve/change the response accordingly."

    user_prompt = f"Situation/message to respond to:\n\"{request.input_text}\"{screen_context}{preference_context}{tone_context}{modifier_context}\n\nGenerate the 3 decision options + insights as JSON."

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

        return {
            "safe": result.get("safe", {}),
            "smart": result.get("smart", {}),
            "bold": result.get("bold", {}),
            "reasoning": result.get("reasoning", {}),
            "insights": result.get("insights", {}),
        }

    except json.JSONDecodeError:
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
            return {
                "safe": result.get("safe", {}),
                "smart": result.get("smart", {}),
                "bold": result.get("bold", {}),
                "reasoning": result.get("reasoning", {}),
                "insights": result.get("insights", {}),
            }
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {str(e2)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
