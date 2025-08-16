from pydantic import BaseModel

class UserRegister(BaseModel):
    username: str
    password: str
    email: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class RegisterResponse(BaseModel):
    status: str
    message: str
