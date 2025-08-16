from langchain_core.tools import tool
from langchain.chains import RetrievalQA
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.base import AttributeInfo
from langchain_core.documents import Document
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Dict, Any, Optional
import re

from app.agents.config import (
    get_llm_for_retrieve_recipe, 
    get_retriever_for_retrieve_recipe,
    get_vectordb_for_retrieve_recipe
)

# Initialize components
llm = get_llm_for_retrieve_recipe()
vectordb = get_vectordb_for_retrieve_recipe()

# Define metadata field information for Self Query Retriever
metadata_field_info = [
    AttributeInfo(
        name="section",
        description="The section of the recipe (main_info, ingredients, directions, nutrition, image)",
        type="string",
    ),
    AttributeInfo(
        name="title",
        description="The name/title of the recipe dish",
        type="string",
    ),
    AttributeInfo(
        name="prep_time",
        description="Preparation time in minutes",
        type="integer",
    ),
    AttributeInfo(
        name="total_time",
        description="Total cooking time in minutes",
        type="integer",
    ),
    AttributeInfo(
        name="servings",
        description="Number of servings the recipe makes",
        type="integer",
    ),
    AttributeInfo(
        name="ingredient_count",
        description="Number of ingredients in the recipe",
        type="integer",
    ),
    AttributeInfo(
        name="calories",
        description="Calories per serving",
        type="integer",
    ),
    AttributeInfo(
        name="protein",
        description="Protein content in grams per serving",
        type="float",
    ),
    AttributeInfo(
        name="carbs",
        description="Carbohydrates content in grams per serving",
        type="float",
    ),
    AttributeInfo(
        name="fat",
        description="Fat content in grams per serving",
        type="float",
    ),
    AttributeInfo(
        name="fiber",
        description="Dietary fiber in grams per serving",
        type="float",
    ),
    AttributeInfo(
        name="sodium",
        description="Sodium content in mg per serving",
        type="float",
    ),
    AttributeInfo(
        name="sugar",
        description="Sugar content in grams per serving",
        type="float",
    ),
]

document_content_description = "Recipes with detailed information including ingredients, cooking directions, nutritional information, and cooking times"

# Create Self Query Retriever
self_query_retriever = SelfQueryRetriever.from_llm(
    llm,
    vectordb,
    document_content_description,
    metadata_field_info,
    verbose=True,
    search_kwargs={"k": 6}  # Retrieve more documents for better coverage
)

class EnhancedRecipeRetriever:
    def __init__(self):
        self.llm = llm
        self.vectordb = vectordb
        self.self_query_retriever = self_query_retriever
        
        # Create enhanced prompt template
        self.system_prompt = """You are a helpful cooking assistant that provides detailed recipe information.
        When answering questions about recipes, use the provided context documents to give comprehensive and accurate responses.
        
        Guidelines:
        - If asked about nutrition information, focus on nutritional content and health aspects
        - If asked about ingredients, provide complete ingredient lists with quantities
        - If asked about cooking directions, give step-by-step instructions
        - If asked about timing, provide prep time, cook time, and total time
        - Always mention the recipe name and serving size when relevant
        - If multiple recipes are found, organize your response clearly
        
        Context: {context}
        
        Question: {input}
        
        Answer:"""
        
        self.prompt = ChatPromptTemplate.from_template(self.system_prompt)
        
        # Create document chain
        self.document_chain = create_stuff_documents_chain(self.llm, self.prompt)
        
        # Create retrieval chain
        self.retrieval_chain = create_retrieval_chain(
            self.self_query_retriever, 
            self.document_chain
        )

    def _analyze_query_intent(self, query: str) -> Dict[str, Any]:
        """Analyze query to determine what type of information is needed"""
        query_lower = query.lower()
        
        intent = {
            "needs_nutrition": False,
            "needs_ingredients": False,
            "needs_directions": False,
            "needs_timing": False,
            "needs_general": True
        }
        
        # Check for nutrition-related keywords
        nutrition_keywords = [
            'nutrition', 'calories', 'protein', 'carbs', 'fat', 'fiber', 
            'sodium', 'sugar', 'healthy', 'diet', 'nutritional', 'macro'
        ]
        if any(keyword in query_lower for keyword in nutrition_keywords):
            intent["needs_nutrition"] = True
            intent["needs_general"] = False
        
        # Check for ingredient-related keywords
        ingredient_keywords = ['ingredient', 'recipe', 'what do i need', 'ingredients']
        if any(keyword in query_lower for keyword in ingredient_keywords):
            intent["needs_ingredients"] = True
        
        # Check for direction-related keywords
        direction_keywords = [
            'how to', 'cook', 'prepare', 'make', 'steps', 'directions', 
            'instructions', 'method', 'cooking process'
        ]
        if any(keyword in query_lower for keyword in direction_keywords):
            intent["needs_directions"] = True
        
        # Check for timing-related keywords
        timing_keywords = ['time', 'long', 'quick', 'fast', 'prep', 'cook']
        if any(keyword in query_lower for keyword in timing_keywords):
            intent["needs_timing"] = True
        
        return intent

    def _create_targeted_retriever(self, query: str, intent: Dict[str, Any]):
        """Create a targeted retriever based on query intent"""
        if intent["needs_nutrition"]:
            # For nutrition queries, prioritize nutrition sections
            return SelfQueryRetriever.from_llm(
                self.llm,
                self.vectordb,
                document_content_description,
                metadata_field_info,
                verbose=True,
                search_kwargs={
                    "k": 4,
                    "filter": {"section": {"$in": ["nutrition"]}}
                }
            )
        elif intent["needs_ingredients"]:
            # For ingredient queries, prioritize ingredients sections
            return SelfQueryRetriever.from_llm(
                self.llm,
                self.vectordb,
                document_content_description,
                metadata_field_info,
                verbose=True,
                search_kwargs={
                    "k": 4,
                    "filter": {"section": {"$in": ["ingredients"]}}
                }
            )
        elif intent["needs_directions"]:
            # For cooking directions, prioritize directions sections
            return SelfQueryRetriever.from_llm(
                self.llm,
                self.vectordb,
                document_content_description,
                metadata_field_info,
                verbose=True,
                search_kwargs={
                    "k": 6,
                    "filter": {"section": {"$in": ["directions"]}}
                }
            )
        elif intent["needs_general"] or intent["needs_timing"]:
            return SelfQueryRetriever.from_llm(
                self.llm,
                self.vectordb,
                document_content_description,
                metadata_field_info,
                verbose=True,
                search_kwargs={
                    "k": 4,
                    "filter": {"section": {"$in": ["main_info"]}}
                }
            )
        else:
            # Use default self query retriever
            return self.self_query_retriever

    def retrieve_and_answer(self, query: str) -> Dict[str, Any]:
        """Enhanced retrieval with intent-based filtering"""
        try:
            # Analyze query intent
            intent = self._analyze_query_intent(query)
            
            # Create targeted retriever
            targeted_retriever = self._create_targeted_retriever(query, intent)
            
            # Create new retrieval chain with targeted retriever
            targeted_chain = create_retrieval_chain(
                targeted_retriever,
                self.document_chain
            )
            
            # Execute retrieval
            result = targeted_chain.invoke({"input": query})
            # Extract relevant information
            answer = result.get("answer", "")
            source_docs = result.get("context", [])
            
            return {
                "answer": answer,
                "source_documents": source_docs,
                "intent": intent,
                "num_sources": len(source_docs)
            }
            
        except Exception as e:
            return {
                "error": f"Error in enhanced retrieval: {str(e)}",
                "answer": None,
                "source_documents": []
            }

# Initialize enhanced retriever
enhanced_retriever = EnhancedRecipeRetriever()

# Traditional RAG chain (kept for compatibility)
traditional_retriever = get_retriever_for_retrieve_recipe()
rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=traditional_retriever,
    return_source_documents=True,
)

@tool("recipe_retrieve_tool", description="Enhanced recipe retrieval with intelligent filtering. Automatically filters for nutrition information when nutrition-related queries are detected.")
def recipe_retrieve_tool(query: str) -> dict:
    """Enhanced recipe retrieval tool with self-query capabilities"""
    try:
        result = enhanced_retriever.retrieve_and_answer(query)
        
        if "error" in result:
            return {
                "tool": "recipe_retrieve_tool", 
                "raw_data": {"error": result["error"]}
            }
        
        return {
            "tool": "recipe_retrieve_tool",
            "raw_data": {
                "result": result["answer"],
                "intent_analysis": result["intent"]
            }
        }
        
    except Exception as e:
        return {
            "tool": "recipe_retrieve_tool", 
            "raw_data": {"error": f"Error retrieving recipe for '{query}': {str(e)}"}
        }
