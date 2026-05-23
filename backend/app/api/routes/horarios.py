from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.horario import Horario
from app.models.disciplina import Disciplina
from app.schemas.schemas import HorarioCreate, HorarioUpdate, HorarioOut

router = APIRouter()
dep = [Depends(get_current_user)]


def _opts():
    return [
        joinedload(Horario.disciplina),
        joinedload(Horario.professor),
        joinedload(Horario.sala),
        joinedload(Horario.turma),
    ]


# Rota pública — usada na tela /grade (alunos/professores, sem auth)
@router.get("/publico", response_model=List[HorarioOut])
def listar_publico(
    semestre_id: Optional[int] = Query(None),
    turma_id: Optional[int] = Query(None),
    professor_id: Optional[int] = Query(None),
    sala_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Horario).options(*_opts())
    if semestre_id:  q = q.filter(Horario.semestre_id == semestre_id)
    if turma_id:     q = q.filter(Horario.turma_id == turma_id)
    if professor_id: q = q.filter(Horario.professor_id == professor_id)
    if sala_id:      q = q.filter(Horario.sala_id == sala_id)
    return q.order_by(Horario.dia_semana, Horario.horario_inicio).all()


# Rota pública — semestres (para popular o select na tela pública)
@router.get("/publico/semestres")
def semestres_publico(db: Session = Depends(get_db)):
    from app.models.semestre import Semestre
    return db.query(Semestre).order_by(Semestre.id.desc()).all()


# Rota pública — turmas
@router.get("/publico/turmas")
def turmas_publico(db: Session = Depends(get_db)):
    from app.models.turma import Turma
    return db.query(Turma).order_by(Turma.nome).all()


# Rota pública — professores
@router.get("/publico/professores")
def professores_publico(db: Session = Depends(get_db)):
    from app.models.professor import Professor
    return db.query(Professor).order_by(Professor.nome).all()


# Rota pública — salas
@router.get("/publico/salas")
def salas_publico(db: Session = Depends(get_db)):
    from app.models.sala import Sala
    return db.query(Sala).order_by(Sala.nome).all()


@router.get("/", response_model=List[HorarioOut])
def listar(
    semestre_id: Optional[int] = Query(None),
    turma_id: Optional[int] = Query(None),
    professor_id: Optional[int] = Query(None),
    sala_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Horario).options(*_opts())
    if semestre_id:  q = q.filter(Horario.semestre_id == semestre_id)
    if turma_id:     q = q.filter(Horario.turma_id == turma_id)
    if professor_id: q = q.filter(Horario.professor_id == professor_id)
    if sala_id:      q = q.filter(Horario.sala_id == sala_id)
    return q.order_by(Horario.dia_semana, Horario.horario_inicio).all()


@router.post("/", response_model=HorarioOut, dependencies=dep)
def criar(data: HorarioCreate, db: Session = Depends(get_db)):
    obj = Horario(**data.model_dump())
    db.add(obj)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(409, _conflict(str(e)))
    db.refresh(obj)
    return db.query(Horario).options(*_opts()).filter(Horario.id == obj.id).first()


@router.put("/{id}", response_model=HorarioOut, dependencies=dep)
def atualizar(id: int, data: HorarioUpdate, db: Session = Depends(get_db)):
    obj = db.query(Horario).filter(Horario.id == id).first()
    if not obj:
        raise HTTPException(404, "Horário não encontrado")
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(409, _conflict(str(e)))
    return db.query(Horario).options(*_opts()).filter(Horario.id == id).first()


@router.delete("/{id}", dependencies=dep)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = db.query(Horario).filter(Horario.id == id).first()
    if not obj:
        raise HTTPException(404, "Horário não encontrado")
    db.delete(obj); db.commit()
    return {"ok": True}


def _conflict(err: str) -> str:
    if "uq_professor_slot" in err: return "Conflito: professor já tem aula neste horário"
    if "uq_sala_slot"      in err: return "Conflito: sala já ocupada neste horário"
    if "uq_turma_slot"     in err: return "Conflito: turma já tem aula neste horário"
    return "Conflito de horário detectado"
