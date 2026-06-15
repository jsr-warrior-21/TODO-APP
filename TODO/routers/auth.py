
from fastapi import APIRouter , Depends, HTTPException,status 
from TODO.database import get_db
from TODO.hashing import Hash
from TODO import models,token,schemas
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(
    tags=["Authentication"]
)

# login
@router.post('/login',response_model=schemas.Token)
async def login(request:OAuth2PasswordRequestForm=Depends(),db:AsyncSession=Depends(get_db)):
    result = await db.execute(
        select(models.User).where(models.User.email==request.username)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code= status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not Hash.verify(user.password, request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token = token.create_access_token(
        data = {"sub":str(user.id)}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }