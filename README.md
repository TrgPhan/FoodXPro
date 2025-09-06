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

##  Usage (Dockerized Version)

### 1. Clone repo
- Clone repo về máy sử dụng git:
```bash
git clone https://github.com/TrgPhan/FoodXPro.git
```
### 2. Chuẩn bị môi trường
- Cài đặt [Docker](https://www.docker.com/) và [Docker Compose](https://docs.docker.com/compose/).
- Tạo môi trường ảo và cài đặt dependences:
  ```bash
  python -m venv .venv
  .venv\Scripts\activate
  pip install -r backend\requirements.txt
  ```
- Tạo file `.env` từ mẫu có sẵn:
  ```bash
  cp .env.example .env
  ```
### 3. Chạy ứng dụng
- Từ thư mục gốc của project, chạy:
  ```bash
  docker compose up -d
  ```
### 4. Truy cập ứng dụng
  Backend API: http://localhost:8000
  Frontend: http://localhost:3000
### 5. Quản lý container
- Dừng ứng dụng:
  ```bash
  docker compose down
  ```
- Xem log realtime:
  ```bash
  docker compose logs -f
  ```


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
