from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db import base_all  # noqa — registra todos os models
from app.db.base import Base
from app.db.init_db import init_db
from app.api.routes import auth, cursos, disciplinas, professores, salas, semestres, horarios


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    init_db()
    yield


app = FastAPI(
    title="Horários Escolares API",
    description="API para gestão de horários de ensino superior",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(semestres.router, prefix="/semestres", tags=["Semestres"])
app.include_router(cursos.router, prefix="/cursos", tags=["Cursos"])
app.include_router(disciplinas.router, prefix="/disciplinas", tags=["Disciplinas"])
app.include_router(professores.router, prefix="/professores", tags=["Professores"])
app.include_router(salas.router, prefix="/salas", tags=["Salas"])
app.include_router(horarios.router, prefix="/horarios", tags=["Horários"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
