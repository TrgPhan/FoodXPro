# FoodXPro: AI-Powered Personalized Diet Management System

## Introduction

**FoodXPro** is a platform that helps users manage nutrition, plan meals, track health, and receive personalized recipe recommendations.  
It uses **Artificial Intelligence (AI)** to analyze individual needs, preferences, and health profiles to suggest suitable meal plans and recipes.

## Key Features

- **Ingredient Management ("Digital Fridge")**: Store, organize, and track ingredient expiration dates to reduce food waste.  
- **Recipe Suggestions & Discovery**: Recommend dishes based on available ingredients or those missing just a few items.  
- **Meal & Nutrition Tracking**: Manage daily meals with total calories, protein, carbs, and fat breakdown.  
- **AI Chatbot Consultation**: 24/7 chat for finding recipes or getting health and nutrition advice.  
- **User Profile**: Save personal information, allergies, dietary preferences, and nutrition goals for personalized recommendations.

## Technology Stack

- **Programming Language**: Python  
- **AI Frameworks**: LangChain, LangGraph  
- **LLM**: Gemini 2.0 Flash (Google)  
- **Vector Database**: ChromaDB (RAG)  
- **Relational Database**: SQLite (QAS)  
- **Data Collection**: Selenium WebDriver (allrecipes.com)  
- **Data Processing**: NER (CRF) for ingredient extraction

## Strengths

- AI analyzes nutrition, preferences, and health goals for accurate suggestions.  
- Real-time automation and personalization.  
- Comprehensive management from ingredients to meal plans.  
- User-friendly and intuitive interface.

## Usage

### Run the Backend

Follow these steps to get the backend server running:

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a new Python virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On macOS/Linux
    venv\Scripts\activate     # On Windows
    ```
3.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Uncomment the `init_db_chroma` function call in `main.py` if this is your first time running the application to initialize the database.
5.  Start the server using Uvicorn:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```
    This will start the backend server, and it will be accessible at `http://localhost:8000`.

---

### Run the Frontend

To run the frontend, follow these steps:

1.  Ensure you have **npm** installed on your system.
2.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
3.  Install the project dependencies:
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    This will start the frontend development server.

---

### Access the Local Web Page

Once both the backend and frontend are running, open your web browser and navigate to:

[http://localhost:3000](http://localhost:3000)

The application should now be fully accessible and operational. 🚀

## Development Team

**TechXPro**  

**Contact**:  
Phan Quang Trường  
- Email: 23020443@vnu.edu.vn  
- Phone: +84 981 529 751  

**Team Members**:  
- Phạm Minh Tú  
- Nguyễn Công Trình  
- Hoàng Sơn  
