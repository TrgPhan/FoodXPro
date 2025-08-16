import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/app.db")


RAW_DIR = os.path.join(BASE_DIR, 'data', 'raw')
RECIPES_FOR_CHROMA_DIR = os.path.join(BASE_DIR, 'data', 'processed')
CHROMA_DB_DIR = os.path.join(BASE_DIR, 'data', 'chroma_db')

# JWT Configuration
SECRET_KEY = os.getenv(
    "SECRET_KEY", "f19b27d44c67e928ab3f03e1c4b079ff55bc8632c63bfe0dc914c25c64a678de")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

NUTRITION_UNITS = {
    "Calories": "kcal",
    "Total Fat": "g",
    "Fat": "g",
    "Carbs": "g",
    "Saturated Fat": 'g',
    "Cholesterol": "mg",
    "Sodium": "mg",
    "Total Carbohydrate": "g",
    "Dietary Fiber": "g",
    "Total Sugars": "g",
    "Sugars": "g",
    "Protein": "g",
    "Vitamin C": "mg",
    "Calcium": "mg",
    "Iron": "mg",
    "Potassium": "mg"
}
