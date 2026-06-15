from fastapi import FastAPI
from .routers import auth, task
from .routers import user
from .database import engine
from . import models
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    
    title="My To-Do API",
    description="A production-ready To-Do app backend"

)
app.add_middleware(
    CORSMiddleware,
    
    allow_origins=["http://localhost:3000", "http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE etc.
    allow_headers=["*"],  # sab headers allow
)

#  Create tables (async way)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)


@app.on_event("startup")
async def on_startup():
    await init_db()




#  Include router
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(task.router)

@app.get("/",tags=['Home'])
def root():
    return {"message": "Welcome to the To-Do API! Go to /docs to test the endpoints."}


