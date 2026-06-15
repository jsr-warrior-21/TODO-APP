from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from TODO import schemas,database,oauth2,models
from datetime import datetime, timezone
from typing import List

router = APIRouter(
    tags=["Tasks"]
)

#create tasks
@router.post("/create",response_model=schemas.ShowTask,status_code=status.HTTP_201_CREATED)
async def create(request:schemas.CreateTask,db:AsyncSession=Depends(database.get_db),current_user = Depends(oauth2.get_current_user)):
    new_task = models.Task(

        title = request.title,
        description = request.description,
        due_date=request.due_date,
        user_id = current_user.id
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    return new_task

@router.get("/overdue",response_model=List[schemas.ShowTask])
async def get_tasks(
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(oauth2.get_current_user)
):
   now = datetime.now(timezone.utc)

   result = await db.execute(
        select(models.Task).where(
            models.Task.user_id == current_user.id,
            models.Task.completed == False,
            models.Task.due_date < now
        )
    )

   return result.scalars().all()

#get tasks
@router.get("/get", response_model=List[schemas.ShowTask])
async def get_tasks(
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(oauth2.get_current_user)
):
    result = await db.execute(
        select(models.Task).where(models.Task.user_id == current_user.id)
    )
    tasks = result.scalars().all()

    return tasks

#update tasks
@router.put("/update/{task_id}",response_model=schemas.ShowTask,status_code=status.HTTP_202_ACCEPTED)
async def update(
    
    task_id:int,
    request:schemas.CreateTask,
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(oauth2.get_current_user)
  ):
                 
                
  result = await db.execute(
     select(models.Task).where(models.Task.id==task_id,models.Task.user_id==current_user.id)

  )
  task = result.scalar_one_or_none()
  if not task:
     raise HTTPException(
        status_code=404,
        detail="Task not found"
     )  
  task.title = request.title
  task.description = request.description
  task.due_date = request.due_date

  await db.commit()
  await db.refresh(task)
  
  return task  

@router.delete('/delete/{task_id}',status_code=200)
async def delete_task(task_id:int,db:AsyncSession=Depends(database.get_db), current_user = Depends(oauth2.get_current_user)):
   result = await db.execute(
      select(models.Task).where(models.Task.id==task_id,models.Task.user_id==current_user.id)
   )
   task = result.scalar_one_or_none()
   if not task:
      raise HTTPException(
         status_code=404,
         detail="task not found"
      )
   
   await db.delete(task)
   await db.commit()
   
   return {"detail":"Task deleted successfully"}
   

@router.patch("/{task_id}/important")
async def mark_important(task_id:int,db:AsyncSession=Depends(database.get_db), current_user = Depends(oauth2.get_current_user)):
    result = await db.execute(
        select(models.Task).where(
            models.Task.id == task_id,
            models.Task.user_id == current_user.id
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(404, "Task not found")

    task.is_important = not task.is_important  # toggle

    await db.commit()
    await db.refresh(task)

@router.get("/important", response_model=List[schemas.ShowTask])
async def get_important_tasks(
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(oauth2.get_current_user)
):
    result = await db.execute(
        select(models.Task).where(
            models.Task.user_id == current_user.id,
            models.Task.is_important == True
        ).order_by(models.Task.created_at.desc())
    )

    tasks = result.scalars().all()

    return tasks