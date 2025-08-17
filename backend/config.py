import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/app.db")


RAW_DIR = os.path.join(BASE_DIR, 'data', 'raw')
RECIPES_FOR_CHROMA_DIR = os.path.join(BASE_DIR, 'data', 'processed')
CHROMA_DB_DIR = os.path.join(BASE_DIR, 'data', 'chroma_db')

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "f19b27d44c67e928ab3f03e1c4b079ff55bc8632c63bfe0dc914c25c64a678de")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

GOGGLE_API_KEY = "AIzaSyD9urUgfGXt2fYlTqaBJH1d_D9EPhwv-fU"
CSE_ID = "46f56727adffb43ef"

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

CONVERT_TO_CALORIES = {
    "Fat": 9,
    "Carbs": 4,
    "Protein": 4
}

ACTIVITY_LEVELS = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Super Active': 1.9,
    'Không vận động': 1.2,
    'Ít vận động': 1.375,
    'Vận động vừa phải': 1.55,
    'Vận động nhiều': 1.725,
    'Vận động rất nhiều': 1.9
}

EATING_GOALS = {
    "Bulking": {
        "calories": 1.15,
        "protein": 0.3,
        "fat": 0.25,
        "carbohydrates": 0.45
    },
    "Maintaining": {
        "calories": 1.0,
        "protein": 0.25,
        "fat": 0.225,
        "carbohydrates": 0.525
    },
    "Cutting": {
        "calories": 0.825,
        "protein": 0.35,
        "fat": 0.3,
        "carbohydrates": 0.35
    },
    "Tăng cân": {
        "calories": 1.15,
        "protein": 0.3,
        "fat": 0.25,
        "carbohydrates": 0.45
    },
    "Giữ cân": {
        "calories": 1.0,
        "protein": 0.25,
        "fat": 0.225,
        "carbohydrates": 0.525
    },
    "Giảm cân": {
        "calories": 0.825,
        "protein": 0.35,
        "fat": 0.3,
        "carbohydrates": 0.35
    }
}