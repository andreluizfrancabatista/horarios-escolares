from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.disponibilidade import DisponibilidadeProfessor
from app.schemas.schemas import DisponibilidadeCreate, DisponibilidadeOut

router = APIRouter()
dep = [Depends(get_current_user)]


@router.get("/", response_model=List[DisponibilidadeOut])
def listar(
    semestre_id:  Optional[int] = Query(None),
    professor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(DisponibilidadeProfessor)
    if semestre_id:  q = q.filter(DisponibilidadeProfessor.semestre_id  == semestre_id)
    if professor_id: q = q.filter(DisponibilidadeProfessor.professor_id == professor_id)
    return q.all()


@router.post("/", response_model=DisponibilidadeOut, dependencies=dep)
def salvar(data: DisponibilidadeCreate, db: Session = Depends(get_db)):
    # Upsert: se já existe o slot, atualiza o tipo
    existing = db.query(DisponibilidadeProfessor).filter(
        DisponibilidadeProfessor.semestre_id   == data.semestre_id,
        DisponibilidadeProfessor.professor_id  == data.professor_id,
        DisponibilidadeProfessor.dia_semana    == data.dia_semana,
        DisponibilidadeProfessor.horario_inicio== data.horario_inicio,
    ).first()
    if existing:
        existing.tipo = data.tipo
        db.commit(); db.refresh(existing)
        return existing
    obj = DisponibilidadeProfessor(**data.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.delete("/", dependencies=dep)
def deletar_slot(
    semestre_id:    int = Query(...),
    professor_id:   int = Query(...),
    dia_semana:     str = Query(...),
    horario_inicio: str = Query(...),
    db: Session = Depends(get_db),
):
    obj = db.query(DisponibilidadeProfessor).filter(
        DisponibilidadeProfessor.semestre_id   == semestre_id,
        DisponibilidadeProfessor.professor_id  == professor_id,
        DisponibilidadeProfessor.dia_semana    == dia_semana,
        DisponibilidadeProfessor.horario_inicio== horario_inicio,
    ).first()
    if obj:
        db.delete(obj); db.commit()
    return {"ok": True}


@router.put("/professor/{professor_id}/semestre/{semestre_id}", dependencies=dep)
def salvar_grade_completa(
    professor_id: int,
    semestre_id:  int,
    slots: List[DisponibilidadeCreate],
    db: Session = Depends(get_db),
):
    """Substitui toda a disponibilidade do professor no semestre de uma vez."""
    db.query(DisponibilidadeProfessor).filter(
        DisponibilidadeProfessor.professor_id == professor_id,
        DisponibilidadeProfessor.semestre_id  == semestre_id,
    ).delete()
    for s in slots:
        db.add(DisponibilidadeProfessor(**s.model_dump()))
    db.commit()
    return {"ok": True, "slots": len(slots)}
