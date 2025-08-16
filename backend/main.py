#                    _oo8oo_
#                   088888880
#                   88" + "88
#                   (| -_- |)
#                   0\  *  /0
#                  __/'---'\__
#               .' \\|     |//' .
#              / \\|||  :  |||// \
#             / _||||| -:- |||||- \
#            |   | \\\  -  /// |   |
#            | \_|  ''\---/''  |_/ |
#            \  .-\__  '-'  __/-.  /
#          ___'. .'  /--.--\  '. .'___
#        ."" '< '.___\_<|>_/___.' >' "".
#       | | : '- \'.;'\ _ /';.'/ - ' : | |
#       \  \ '_.  \____\ /____/  .-'  /  /
#   ====='-.____.___ \_____/ ___.-'__.-'=====
#                    '=---='
#
#   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#         Phật phù hộ, không bao giờ BUG
#   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, func, delete, update
from fastapi import FastAPI
from crud import init_db_data
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from utils.logger_config import get_logger

from models import ingredients, nutritions, recipeHaveNutrition, recipeIncludeIngredient
from models import users, userAllergies, userHealthConditions, userIngredients, userMeals
from models import allergies, healthConditions, recipes, ingredientAllergies, healthConditionAffectNutrition
from db import Base, engine
from app.services.vectorstore.embedder import init_chroma_db

from routers.auth.api import router as auth_router
from routers.recipes.api import router as recipes_router
from routers.profile.api import router as profile_router
from routers.allergy.api import router as allergy_router
from routers.daily_meals.api import router as daily_meals_router

logger = get_logger("recipe-assistant")

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-frontend-domain.com",
    "http://localhost:3000",
    "http://192.168.56.1:3000"

]


@app.on_event("startup")
async def startup_event():
    # create a new database if there is none
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await init_db_data()
        # await init_chroma_db()


@app.get("/")
def root():
    logger.info("Root endpoint called")
    return {"message": "Recipe Assistant API is running!"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(recipes_router, prefix="/recipes", tags=["Recipes"])
app.include_router(profile_router, prefix="/profile", tags=["Profile"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(allergy_router,prefix="/allergies", tags=["Allergies"])
app.include_router(daily_meals_router,prefix="/daily-meals", tags=["Daily Meals"])