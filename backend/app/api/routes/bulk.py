"""
Importação em massa via CSV e deleção em bulk.

Colunas por entidade:
  turmas:      nome, codigo, turno
  disciplinas: nome
  professores: nome
  salas:       nome, tipo, bloco
"""
import csv, io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.professor import Professor
from app.models.turma import Turma
from app.models.disciplina import Disciplina
from app.models.sala import Sala

router = APIRouter()
dep = [Depends(get_current_user)]

REQUIRED_COLUMNS = {
    "turmas":      {"nome", "codigo", "turno"},
    "disciplinas": {"nome"},
    "professores": {"nome"},
    "salas":       {"nome"},
}


def parse_csv(content: bytes):
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
    rows = [{k.strip().lower(): v for k, v in row.items()} for row in reader]
    return fieldnames, rows


def validate_columns(fieldnames, entidade):
    required = REQUIRED_COLUMNS.get(entidade, set())
    missing = required - set(fieldnames)
    if missing:
        raise HTTPException(422,
            f"CSV inválido para '{entidade}'. "
            f"Colunas ausentes: {', '.join(sorted(missing))}. "
            f"Encontradas: {', '.join(fieldnames) or '(nenhuma)'}.")


def _result(created, errors):
    return {"criados": created, "erros": errors}


@router.post("/turmas", dependencies=dep)
async def bulk_turmas(file: UploadFile = File(...), db: Session = Depends(get_db)):
    fieldnames, rows = parse_csv(await file.read())
    validate_columns(fieldnames, "turmas")
    created, errors = 0, []
    turnos_validos = {"Manhã", "Tarde", "Noite", "Integral"}
    for i, row in enumerate(rows, 2):
        nome   = (row.get("nome")   or "").strip()
        codigo = (row.get("codigo") or "").strip()
        turno  = (row.get("turno")  or "Manhã").strip()
        if not nome or not codigo:
            errors.append({"linha": i, "erro": "'nome' e 'codigo' obrigatórios"}); continue
        if turno not in turnos_validos:
            errors.append({"linha": i, "erro": f"Turno inválido: '{turno}'"}); continue
        if db.query(Turma).filter(Turma.codigo == codigo).first():
            errors.append({"linha": i, "erro": f"Código '{codigo}' já existe"}); continue
        try:
            db.add(Turma(nome=nome, codigo=codigo, turno=turno))
            db.flush(); created += 1
        except Exception as e:
            db.rollback(); errors.append({"linha": i, "erro": str(e)})
    db.commit()
    return _result(created, errors)


@router.post("/disciplinas", dependencies=dep)
async def bulk_disciplinas(file: UploadFile = File(...), db: Session = Depends(get_db)):
    fieldnames, rows = parse_csv(await file.read())
    validate_columns(fieldnames, "disciplinas")
    created, errors = 0, []
    for i, row in enumerate(rows, 2):
        nome = (row.get("nome") or "").strip()
        if not nome:
            errors.append({"linha": i, "erro": "'nome' obrigatório"}); continue
        try:
            db.add(Disciplina(nome=nome))
            db.flush(); created += 1
        except Exception as e:
            db.rollback(); errors.append({"linha": i, "erro": str(e)})
    db.commit()
    return _result(created, errors)


@router.post("/professores", dependencies=dep)
async def bulk_professores(file: UploadFile = File(...), db: Session = Depends(get_db)):
    fieldnames, rows = parse_csv(await file.read())
    validate_columns(fieldnames, "professores")
    created, errors = 0, []
    for i, row in enumerate(rows, 2):
        nome = (row.get("nome") or "").strip()
        if not nome:
            errors.append({"linha": i, "erro": "'nome' obrigatório"}); continue
        try:
            db.add(Professor(nome=nome))
            db.flush(); created += 1
        except Exception as e:
            db.rollback(); errors.append({"linha": i, "erro": str(e)})
    db.commit()
    return _result(created, errors)


@router.post("/salas", dependencies=dep)
async def bulk_salas(file: UploadFile = File(...), db: Session = Depends(get_db)):
    fieldnames, rows = parse_csv(await file.read())
    validate_columns(fieldnames, "salas")
    created, errors = 0, []
    for i, row in enumerate(rows, 2):
        nome = (row.get("nome") or "").strip()
        if not nome:
            errors.append({"linha": i, "erro": "'nome' obrigatório"}); continue
        try:
            db.add(Sala(
                nome=nome,
                tipo=(row.get("tipo") or "Sala comum").strip(),
                bloco=(row.get("bloco") or "").strip() or None,
                ativa=True,
            ))
            db.flush(); created += 1
        except Exception as e:
            db.rollback(); errors.append({"linha": i, "erro": str(e)})
    db.commit()
    return _result(created, errors)


# ── Bulk Delete ────────────────────────────────────────────────────────────────

class BulkDeleteRequest(BaseModel):
    ids: list[int]


def _bulk_delete(db, Model, ids):
    deleted = db.query(Model).filter(Model.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"deletados": deleted}


@router.delete("/turmas",      dependencies=dep)
def bulk_delete_turmas(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    return _bulk_delete(db, Turma, req.ids)

@router.delete("/disciplinas", dependencies=dep)
def bulk_delete_disciplinas(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    return _bulk_delete(db, Disciplina, req.ids)

@router.delete("/professores", dependencies=dep)
def bulk_delete_professores(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    return _bulk_delete(db, Professor, req.ids)

@router.delete("/salas",       dependencies=dep)
def bulk_delete_salas(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    return _bulk_delete(db, Sala, req.ids)
