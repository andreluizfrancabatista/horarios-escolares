from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.alocacao import AlocacaoProfessor
from app.schemas.schemas import AlocacaoCreate, AlocacaoOut

router = APIRouter()
dep = [Depends(get_current_user)]

LOAD = [
    joinedload(AlocacaoProfessor.professor),
    joinedload(AlocacaoProfessor.disciplina),
    joinedload(AlocacaoProfessor.turma),
]


@router.get("/", response_model=List[AlocacaoOut])
def listar(
    semestre_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(AlocacaoProfessor).options(*LOAD)
    if semestre_id:
        q = q.filter(AlocacaoProfessor.semestre_id == semestre_id)
    return q.order_by(AlocacaoProfessor.turma_id, AlocacaoProfessor.disciplina_id).all()


@router.post("/", response_model=AlocacaoOut, dependencies=dep)
def criar(data: AlocacaoCreate, db: Session = Depends(get_db)):
    obj = AlocacaoProfessor(**data.model_dump())
    db.add(obj)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(409, "Esta disciplina/turma já tem professor alocado neste semestre")
    db.refresh(obj)
    return db.query(AlocacaoProfessor).options(*LOAD).filter(AlocacaoProfessor.id == obj.id).first()


@router.delete("/{id}", dependencies=dep)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = db.query(AlocacaoProfessor).filter(AlocacaoProfessor.id == id).first()
    if not obj:
        raise HTTPException(404, "Alocação não encontrada")
    db.delete(obj); db.commit()
    return {"ok": True}
