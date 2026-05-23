from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.horario import Horario
from app.schemas.schemas import SolverRequest, SolverResponse, SlotProposto
from app.services.solver import rodar_solver

router = APIRouter()
dep = [Depends(get_current_user)]


@router.post("/rodar", response_model=SolverResponse, dependencies=dep)
def rodar(req: SolverRequest, db: Session = Depends(get_db)):
    """Executa o solver e retorna a grade proposta (sem salvar)."""
    return rodar_solver(req.semestre_id, db)


@router.post("/aceitar", dependencies=dep)
def aceitar(slots: list[SlotProposto], semestre_id: int, db: Session = Depends(get_db)):
    """
    Aceita a proposta do solver: apaga os horários existentes do semestre
    e insere os novos slots propostos.
    """
    # Remove grade atual do semestre
    db.query(Horario).filter(Horario.semestre_id == semestre_id).delete()

    from app.models.sala import Sala
    salas = db.query(Sala).filter(Sala.ativa == True).all()
    sala_ids = [s.id for s in salas]

    inseridos = 0
    for sp in slots:
        # Escolhe a primeira sala disponível no slot (já foi alocada pelo solver)
        sala_id = sp.sala_id
        h = Horario(
            semestre_id=semestre_id,
            turma_id=sp.turma_id,
            disciplina_id=sp.disciplina_id,
            professor_id=sp.professor_id,
            sala_id=sala_id,
            dia_semana=sp.dia_semana,
            horario_inicio=sp.horario_inicio,
            horario_fim=sp.horario_fim,
        )
        db.add(h)
        inseridos += 1

    db.commit()
    return {"ok": True, "inseridos": inseridos}
