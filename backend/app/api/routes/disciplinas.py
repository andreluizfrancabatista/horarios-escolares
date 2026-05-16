from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.disciplina import Disciplina
from app.schemas.schemas import DisciplinaCreate, DisciplinaUpdate, DisciplinaOut

router = APIRouter()
dep = [Depends(get_current_user)]


def get_or_404(db, id):
    obj = db.query(Disciplina).filter(Disciplina.id == id).first()
    if not obj:
        raise HTTPException(404, "Disciplina não encontrada")
    return obj


@router.get("/", response_model=List[DisciplinaOut])
def listar(curso_id: Optional[int] = Query(None), db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Disciplina).options(joinedload(Disciplina.curso))
    if curso_id:
        q = q.filter(Disciplina.curso_id == curso_id)
    return q.order_by(Disciplina.nome).all()


@router.post("/", response_model=DisciplinaOut, dependencies=dep)
def criar(data: DisciplinaCreate, db: Session = Depends(get_db)):
    obj = Disciplina(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{id}", response_model=DisciplinaOut, dependencies=dep)
def obter(id: int, db: Session = Depends(get_db)):
    obj = db.query(Disciplina).options(joinedload(Disciplina.curso)).filter(Disciplina.id == id).first()
    if not obj:
        raise HTTPException(404, "Disciplina não encontrada")
    return obj


@router.put("/{id}", response_model=DisciplinaOut, dependencies=dep)
def atualizar(id: int, data: DisciplinaUpdate, db: Session = Depends(get_db)):
    obj = get_or_404(db, id)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{id}", dependencies=dep)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = get_or_404(db, id)
    db.delete(obj)
    db.commit()
    return {"ok": True}
