from dotenv import load_dotenv
import json
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from app.agents.tools.retrieve_recipe_tool import recipe_retrieve_tool
from app.agents.config import get_llm_for_agent
from app.agents.tools.get_daily_meals_tool import get_daily_meals_tool
from app.agents.tools.get_ingredient_tool import get_ingredient_tool
from app.agents.tools.get_sufficient_recipes_tool import get_sufficient_recipes_tool
from app.agents.tools.get_insufficient_recipes_tool import get_insufficient_recipes_tool
from app.agents.tools.get_profile_tool import get_profile_tool
from app.agents.tools.get_daily_nutrition_gaps_tool import get_daily_nutrition_gaps_tool
from app.agents.tools.suggest_meals_tool import suggest_meals_tool
from app.agents.prompt.agent_prompt import prompt

def create_conversational_agent():
    """Tạo agent với khả năng hội thoại"""
    tools = [
        recipe_retrieve_tool,
        get_daily_meals_tool,
        get_ingredient_tool,
        get_sufficient_recipes_tool,
        get_insufficient_recipes_tool,
        get_profile_tool,
        get_daily_nutrition_gaps_tool,
        suggest_meals_tool,
    ]
    agent_executor = create_react_agent(
        model=get_llm_for_agent(),
        tools=tools,
        prompt=prompt,
        debug=False,
    )
    return agent_executor


async def process_message(user_messages, history_conversation=None, limit_message=None):
    """
    Xử lý hội thoại cho api
    user_messages: request người dùng
    history_conversation: lịch sử cuộc hội thoại
    limit_message: giới hạn tin nhắn trong 1 cuộc hội thoại
    """
    if history_conversation == None:
        history_conversation = []

    if limit_message and len(history_conversation) > limit_message:
        history_conversation = history_conversation[-limit_message:]
    history_conversation.append(HumanMessage(content=user_messages))

    agent_executor = create_conversational_agent()
    state = await agent_executor.ainvoke({"messages" : history_conversation})

    assistant_response = state['messages'][-1].content

    history_conversation.append(AIMessage(content=assistant_response))
    tools_used = []
    for msg in state.get("messages", []):
        # msg.content có thể là str hoặc dict tuỳ triển khai agent/tool
        content = msg.content
        # nếu content đã là dict có key 'tool'
        if isinstance(content, dict) and content.get("tool"):
            tools_used.append({"tool": content.get("tool"), "raw_data": content.get("raw_data")})
            continue
        # nếu content là string, thử parse JSON
        if isinstance(content, str):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict) and parsed.get("tool"):
                    tools_used.append({"tool": parsed.get("tool"), "raw_data": parsed.get("raw_data")})
            except Exception:
                # not JSON -> ignore
                pass

    # trim history if needed
    if limit_message and len(history_conversation) > limit_message:
        history_conversation = history_conversation[-limit_message:]

    # Kết quả: trả về cả response text + structured data
    data = {"tools": [t["tool"] for t in tools_used], "raws": [t["raw_data"] for t in tools_used]}
    return assistant_response, history_conversation, data