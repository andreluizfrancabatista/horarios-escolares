from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.professor import Professor
from app.schemas.schemas import ProfessorCreate, ProfessorUpdate, ProfessorOut

router = APIRouter()
dep = [Depends(get_current_user)]


def get_or_404(db, id):
    obj = db.query(Professor).filter(Professor.id == id).first()
    if not obj:
        raise HTTPException(404, "Professor não encontrado")
    return obj


@router.get("/", response_model=List[ProfessorOut])
def listar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Professor).order_by(Professor.nome).all()


@router.post("/", response_model=ProfessorOut, dependencies=dep)
def criar(data: ProfessorCreate, db: Session = Depends(get_db)):
    obj = Professor(**data.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.get("/{id}", response_model=ProfessorOut, dependencies=dep)
def obter(id: int, db: Session = Depends(get_db)):
    return get_or_404(db, id)


@router.put("/{id}", response_model=ProfessorOut, dependencies=dep)
def atualizar(id: int, data: ProfessorUpdate, db: Session = Depends(get_db)):
    obj = get_or_404(db, id)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj


@router.delete("/{id}", dependencies=dep)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = get_or_404(db, id)
    db.delete(obj); db.commit()
    return {"ok": True}
