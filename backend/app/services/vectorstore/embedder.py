import os
import json
import re
from dotenv import load_dotenv
from typing import List, Dict, Any

from config import RECIPES_FOR_CHROMA_DIR, CHROMA_DB_DIR

from langchain.schema import Document
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

def parse_recipe_sections(raw_text: str) -> Dict[str, str]:
    """
    Tách raw_text theo các header phổ biến. 
    Trả về dict với keys: id_name_desc_serv_yield, ingredients, directions, nutrition, detailed_nutrition, image_url
    """
    parts = re.split(
        r'(?m)^(Ingredients:|Directions:|Nutrition|Detailed Nutrition Info|Image URL:|Description:)',
        raw_text,
        flags=re.IGNORECASE
    )
    sections = {
        "id_name_desc_serv_yield": "",
        "ingredients": "",
        "directions": "",
        "nutrition": "",
        "detailed_nutrition": "",
        "image_url": ""
    }
    
    if len(parts) == 1:
        sections["id_name_desc_serv_yield"] = parts[0].strip()
        return sections

    # initial text before any header
    if parts[0].strip():
        sections["id_name_desc_serv_yield"] = parts[0].strip()

    i = 1
    while i < len(parts) - 1:
        header = parts[i].strip().lower().rstrip(':')
        body = parts[i + 1].strip()
        
        if 'ingredient' in header:
            sections["ingredients"] = body
        elif 'direction' in header:
            sections["directions"] = body
        elif 'detailed nutrition' in header:
            sections["detailed_nutrition"] = body
        elif 'nutrition' in header:
            sections["nutrition"] = body
        elif 'image url' in header:
            sections["image_url"] = body.splitlines()[0].strip() if body else ""
        elif 'description' in header:
            sections["id_name_desc_serv_yield"] = (sections["id_name_desc_serv_yield"] + "\n" + body).strip()
        i += 2

    return sections

def extract_enhanced_metadata(content: str, existing_meta: Dict[str, Any]) -> Dict[str, Any]:
    """
    Trích xuất metadata chi tiết từ content để hỗ trợ Self Query Retrieval
    """
    meta = existing_meta.copy()
    
    # Extract basic info
    rid = meta.get("id") or meta.get("ID")
    if not rid:
        m_id = re.search(r'(?m)^ID:\s*(\d+)', content)
        if m_id:
            rid = int(m_id.group(1))
            meta["id"] = rid
    
    title = meta.get("title")
    if not title:
        m_name = re.search(r'(?i)Name of dish:\s*(.+)', content)
        if m_name:
            title = m_name.group(1).strip()
            meta["title"] = title
    
    # Extract time information
    prep_time_match = re.search(r'Prep Time:\s*(\d+)\s*(mins?|minutes?|hrs?|hours?)', content, re.IGNORECASE)
    if prep_time_match:
        time_val = int(prep_time_match.group(1))
        unit = prep_time_match.group(2).lower()
        if 'hr' in unit or 'hour' in unit:
            time_val *= 60
        meta["prep_time"] = time_val
    
    total_time_match = re.search(r'Total Time:\s*(\d+)\s*(mins?|minutes?|hrs?|hours?)', content, re.IGNORECASE)
    if total_time_match:
        time_val = int(total_time_match.group(1))
        unit = total_time_match.group(2).lower()
        if 'hr' in unit or 'hour' in unit:
            time_val *= 60
        meta["total_time"] = time_val
    
    additional_time_match = re.search(r'Additional Time:\s*(\d+)\s*(mins?|minutes?|hrs?|hours?)', content, re.IGNORECASE)
    if additional_time_match:
        time_val = int(additional_time_match.group(1))
        unit = additional_time_match.group(2).lower()
        if 'hr' in unit or 'hour' in unit:
            time_val *= 60
        meta["additional_time"] = time_val
    
    # Extract serving information
    serving_match = re.search(r'Servings?:\s*(\d+)', content, re.IGNORECASE)
    if serving_match:
        meta["servings"] = int(serving_match.group(1))
    
    
    # Count ingredients
    ingredients_section = ""
    ingredients_match = re.search(r'Ingredients:\s*\n?(.+?)(?=\nDirections:|$)', content, re.DOTALL | re.IGNORECASE)
    if ingredients_match:
        ingredients_section = ingredients_match.group(1)
        # Count ingredients by counting bullet points or numbered items
        ingredient_count = len(re.findall(r'[-*•]\s*|^\d+\.', ingredients_section, re.MULTILINE))
        if ingredient_count == 0:  # If no bullets, count semicolons or commas
            ingredient_count = len(re.findall(r';|,(?=\s*\d)', ingredients_section)) + 1
        meta["ingredient_count"] = max(1, ingredient_count)
    
    # Extract main nutrition info
    nutrition_match = re.search(r'Nutrition \(per serving\):\s*(\d+)\s*cal;\s*(\d+)g\s*protein;\s*(\d+)g\s*carbs;\s*(\d+)g\s*fat', content, re.IGNORECASE)
    if nutrition_match:
        meta["calories"] = int(nutrition_match.group(1))
        meta["protein"] = float(nutrition_match.group(2))
        meta["carbs"] = float(nutrition_match.group(3))
        meta["fat"] = float(nutrition_match.group(4))
    
    # Extract detailed nutrition
    detailed_nutrition = re.search(r'Detailed Nutrition Info.*?(?=\nImage URL:|$)', content, re.DOTALL | re.IGNORECASE)
    if detailed_nutrition:
        nutrition_text = detailed_nutrition.group(0)
        
        # Extract specific nutrients
        nutrients_patterns = {
            "total_fat": r'Total Fat:\s*([\d.]+)g',
            "saturated_fat": r'Saturated Fat:\s*([\d.]+)g',
            "cholesterol": r'Cholesterol:\s*([\d.]+)mg',
            "sodium": r'Sodium:\s*([\d.]+)mg',
            "fiber": r'Dietary Fiber:\s*([\d.]+)g',
            "sugar": r'Total Sugars:\s*([\d.]+)g',
            "vitamin_c": r'Vitamin C:\s*([\d.]+)mg',
            "calcium": r'Calcium:\s*([\d.]+)mg',
            "iron": r'Iron:\s*([\d.]+)mg',
            "potassium": r'Potassium:\s*([\d.]+)mg'
        }
        
        for nutrient, pattern in nutrients_patterns.items():
            match = re.search(pattern, nutrition_text, re.IGNORECASE)
            if match:
                meta[nutrient] = float(match.group(1))
    
    return meta

def enhanced_build_docs_from_item(item: Dict[str, Any], chunk_directions: bool = True, 
                                dir_chunk_size: int = 400, dir_chunk_overlap: int = 50) -> List[Document]:
    """
    Enhanced version with comprehensive metadata extraction for Self Query Retrieval
    """
    content = item.get("content", "") or ""
    existing_meta = item.get("metadata", {}) or {}
    
    # Extract enhanced metadata
    meta = extract_enhanced_metadata(content, existing_meta)
    
    # Fallback values
    if not meta.get("id"):
        meta["id"] = f"noid_{abs(hash(content)) % (10**9)}"
    if not meta.get("title"):
        meta["title"] = "Unknown Dish"
    
    # Parse sections
    sections = parse_recipe_sections(content)
    docs = []
    
    # 1) Main information document
    id_name_desc_lines = sections.get("id_name_desc_serv_yield", "").strip()
    page_main = f"Recipe: {meta['title']}\n\nBasic Information:\n{id_name_desc_lines}"
    docs.append(Document(
        page_content=page_main, 
        metadata={**meta, "section": "main_info"}
    ))

    # 2) Ingredients document
    if sections.get("ingredients"):
        ingredients_text = sections["ingredients"]
        page_ing = f"Ingredients for {meta['title']}:\n\n{ingredients_text}"
        docs.append(Document(
            page_content=page_ing, 
            metadata={**meta, "section": "ingredients"}
        ))

    # 3) Directions document(s)
    directions_text = sections.get("directions", "")
    if directions_text:
        if chunk_directions and len(directions_text) > dir_chunk_size:
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=dir_chunk_size, 
                chunk_overlap=dir_chunk_overlap
            )
            dir_chunks = splitter.split_text(directions_text)
            for i, chunk in enumerate(dir_chunks):
                page_dir = f"Cooking directions for {meta['title']} (Part {i+1}):\n\n{chunk}"
                docs.append(Document(
                    page_content=page_dir, 
                    metadata={**meta, "section": "directions", "chunk_index": i}
                ))
        else:
            page_dir = f"Cooking directions for {meta['title']}:\n\n{directions_text}"
            docs.append(Document(
                page_content=page_dir, 
                metadata={**meta, "section": "directions"}
            ))

    # 4) Nutrition document
    nutrition_text = sections.get("nutrition", "")
    detailed_nutrition = sections.get("detailed_nutrition", "")
    
    if nutrition_text or detailed_nutrition:
        full_nutrition = f"{nutrition_text}\n\n{detailed_nutrition}".strip()
        page_nut = f"Nutritional information for {meta['title']}:\n\n{full_nutrition}"
        docs.append(Document(
            page_content=page_nut, 
            metadata={**meta, "section": "nutrition"}
        ))

    # 5) Image document (optional)
    image_url = sections.get("image_url", "")
    if image_url:
        page_img = f"Image of {meta['title']}:\n\n{image_url}"
        docs.append(Document(
            page_content=page_img, 
            metadata={**meta, "section": "image"}
        ))

    return docs

def enhanced_embed(json_list: List[Dict[str, Any]]) -> List[Document]:
    """
    Enhanced embedding function with better metadata extraction
    """
    all_docs = []
    for item in json_list:
        docs = enhanced_build_docs_from_item(item, chunk_directions=True)
        all_docs.extend(docs)
    return all_docs

async def init_chroma_db():
    """
    Initialize Chroma DB with enhanced metadata for Self Query Retrieval
    """
    RECIPES_FOR_CHROMA_FILE = os.path.join(RECIPES_FOR_CHROMA_DIR, 'recipes_for_Chroma.json')

    with open(RECIPES_FOR_CHROMA_FILE, "r", encoding='utf-8') as f:
        recipe_data = json.load(f)
    
    # Use enhanced embedding
    texts = enhanced_embed(recipe_data)
    
    # Initialize embedding model
    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    
    # Create vector database
    vectordb = Chroma.from_documents(
        texts, 
        embedding_model, 
        persist_directory=CHROMA_DB_DIR
    )
    
    print(f"Successfully created Chroma DB with {len(texts)} documents")