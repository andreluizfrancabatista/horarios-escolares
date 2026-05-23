from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db import base_all  # noqa
from app.db.base import Base
from app.db.init_db import init_db
from app.api.routes import (
    auth, turmas, disciplinas, professores, salas,
    semestres, horarios, bulk, alocacoes, disponibilidades, solver,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    init_db()
    yield


app = FastAPI(title="Horários Escolares API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth.router,              prefix="/auth",              tags=["Autenticação"])
app.include_router(semestres.router,         prefix="/semestres",         tags=["Semestres"])
app.include_router(turmas.router,            prefix="/turmas",            tags=["Turmas"])
app.include_router(disciplinas.router,       prefix="/disciplinas",       tags=["Disciplinas"])
app.include_router(professores.router,       prefix="/professores",       tags=["Professores"])
app.include_router(salas.router,             prefix="/salas",             tags=["Salas"])
app.include_router(horarios.router,          prefix="/horarios",          tags=["Horários"])
app.include_router(bulk.router,              prefix="/bulk",              tags=["Importação CSV"])
app.include_router(alocacoes.router,         prefix="/alocacoes",         tags=["Alocações"])
app.include_router(disponibilidades.router,  prefix="/disponibilidades",  tags=["Disponibilidades"])
app.include_router(solver.router,            prefix="/solver",            tags=["Solver OR-Tools"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
