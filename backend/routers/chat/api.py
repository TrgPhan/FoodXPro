from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.agent import process_message
from utils.logger_config import get_logger
router = APIRouter()

SESSION_STORE = {}
logger = get_logger(__name__)
class ChatRequest(BaseModel):
    session_id: str
    message: str

@router.post("/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        history = SESSION_STORE.get(req.session_id, [])
        response, updated_history, data = await process_message(req.message, history, limit_message=5)
        SESSION_STORE[req.session_id] = updated_history
        # trả về cả text response và structured data cho frontend
        return {'response': response, 'data': data}
    except ValueError as e:
        return {'Error': str(e)}
    except Exception as e:
        logger.exception(f"Error in /chat {e}")
        return {"Error": "Internal server error"}