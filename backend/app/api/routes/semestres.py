from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.semestre import Semestre
from app.schemas.schemas import SemestreCreate, SemestreUpdate, SemestreOut

router = APIRouter()
dep = [Depends(get_current_user)]


def get_or_404(db, id):
    obj = db.query(Semestre).filter(Semestre.id == id).first()
    if not obj:
        raise HTTPException(404, "Semestre não encontrado")
    return obj


@router.get("/", response_model=List[SemestreOut])
def listar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Semestre).order_by(Semestre.id.desc()).all()


@router.post("/", response_model=SemestreOut, dependencies=dep)
def criar(data: SemestreCreate, db: Session = Depends(get_db)):
    obj = Semestre(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{id}", response_model=SemestreOut)
def obter(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_or_404(db, id)


@router.put("/{id}", response_model=SemestreOut, dependencies=dep)
def atualizar(id: int, data: SemestreUpdate, db: Session = Depends(get_db)):
    obj = get_or_404(db, id)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    if data.ativo:
        db.query(Semestre).filter(Semestre.id != id).update({"ativo": False})
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{id}", dependencies=dep)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = get_or_404(db, id)
    db.delete(obj)
    db.commit()
    return {"ok": True}


@router.post("/{id}/ativar", response_model=SemestreOut, dependencies=dep)
def ativar(id: int, db: Session = Depends(get_db)):
    db.query(Semestre).update({"ativo": False})
    obj = get_or_404(db, id)
    obj.ativo = True
    db.commit()
    db.refresh(obj)
    return obj
