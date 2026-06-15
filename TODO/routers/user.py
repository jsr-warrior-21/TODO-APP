from fastapi import APIRouter, Depends, HTTPException, status,Path
from sqlalchemy.ext.asyncio import AsyncSession
from TODO import schemas,database ,hashing,models
from sqlalchemy.future import select
from typing import List
router  = APIRouter(
  tags=["Users"],
  prefix="/users"
)

# get all user
@router.get('/',response_model=List[schemas.ShowUser])
async def get_all_users(db: AsyncSession = Depends(database.get_db)):
  
  result = await db.execute(select(models.User))
  users = result.scalars().all()
  return users



# create user
@router.post('/register',response_model=schemas.ShowUser,status_code=status.HTTP_201_CREATED)
async def create_user(request:schemas.CreateUser,db:AsyncSession=Depends(database.get_db)):

 # check if email already exist
 result = await db.execute(
    select(models.User).where(models.User.email==request.email)
 )
 existing_user = result.scalar_one_or_none()
 if existing_user:
    raise HTTPException(
       status_code=status.HTTP_400_BAD_REQUEST,
       detail="User with this Email already registerd"
    )


 # now hash the password
 hashed_password = hashing.Hash.encrypt(request.password)

 # create the new user
 new_user = models.User(
    name = request.name,
    email = request.email,
    password=hashed_password
 )
 try:
  db.add(new_user)
  await db.commit()
  await db.refresh(new_user)
 except Exception:
  await db.rollback() # insert cancel
  raise HTTPException(
    status_code=500,
    detail="Database error"
  )
 return new_user


@router.get('/{id}',response_model=schemas.ShowUser)
async def get_user(id:int=Path(...,gt=0),db:AsyncSession=Depends(database.get_db)):
 # In async SQLAlchemy, we don't use db.query(). We use db.execute(select())
    query = select(models.User).where(models.User.id == id)
    result = await db.execute(query)
 # extract the first result or none
    user  = result.scalar_one_or_none() 
    if not user:
      raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"user with id {id} not found"
      )
    return user