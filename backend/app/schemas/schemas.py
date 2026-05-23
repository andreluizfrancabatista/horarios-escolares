from pydantic import BaseModel
from typing import Optional
from datetime import date


# ─── Auth ─────────────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    nome: str


# ─── Semestre ─────────────────────────────────────────────────────────────────
class SemestreBase(BaseModel):
    nome: str
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    ativo: bool = False

class SemestreCreate(SemestreBase): pass
class SemestreUpdate(SemestreBase): pass
class SemestreOut(SemestreBase):
    id: int
    class Config: from_attributes = True


# ─── Turma ────────────────────────────────────────────────────────────────────
class TurmaBase(BaseModel):
    nome: str
    codigo: str
    turno: str

class TurmaCreate(TurmaBase): pass
class TurmaUpdate(TurmaBase): pass
class TurmaOut(TurmaBase):
    id: int
    class Config: from_attributes = True


# ─── Disciplina (global, sem vínculo com turma) ───────────────────────────────
class DisciplinaBase(BaseModel):
    nome: str

class DisciplinaCreate(DisciplinaBase): pass
class DisciplinaUpdate(DisciplinaBase): pass
class DisciplinaOut(DisciplinaBase):
    id: int
    class Config: from_attributes = True


# ─── Professor ────────────────────────────────────────────────────────────────
class ProfessorBase(BaseModel):
    nome: str

class ProfessorCreate(ProfessorBase): pass
class ProfessorUpdate(ProfessorBase): pass
class ProfessorOut(ProfessorBase):
    id: int
    class Config: from_attributes = True


# ─── Sala ─────────────────────────────────────────────────────────────────────
class SalaBase(BaseModel):
    nome: str
    tipo: Optional[str] = None
    bloco: Optional[str] = None
    ativa: bool = True

class SalaCreate(SalaBase): pass
class SalaUpdate(SalaBase): pass
class SalaOut(SalaBase):
    id: int
    class Config: from_attributes = True


# ─── Horário ──────────────────────────────────────────────────────────────────
class HorarioBase(BaseModel):
    semestre_id: int
    turma_id: int
    disciplina_id: int
    professor_id: Optional[int] = None
    sala_id: Optional[int] = None
    dia_semana: str
    horario_inicio: str
    horario_fim: str

class HorarioCreate(HorarioBase): pass
class HorarioUpdate(HorarioBase): pass
class HorarioOut(HorarioBase):
    id: int
    disciplina: Optional[DisciplinaOut] = None
    professor: Optional[ProfessorOut] = None
    sala: Optional[SalaOut] = None
    turma: Optional[TurmaOut] = None
    class Config: from_attributes = True


# ─── Alocação Professor ───────────────────────────────────────────────────────
class AlocacaoBase(BaseModel):
    semestre_id:   int
    professor_id:  int
    disciplina_id: int
    turma_id:      int
    sala_id:       Optional[int] = None   # sala preferida (suave)

class AlocacaoCreate(AlocacaoBase): pass

class AlocacaoOut(AlocacaoBase):
    id: int
    professor:  Optional[ProfessorOut]  = None
    disciplina: Optional[DisciplinaOut] = None
    turma:      Optional[TurmaOut]      = None
    sala:       Optional[SalaOut]       = None
    class Config: from_attributes = True


# ─── Disponibilidade Professor ────────────────────────────────────────────────
class DisponibilidadeBase(BaseModel):
    semestre_id:    int
    professor_id:   int
    dia_semana:     str
    horario_inicio: str
    tipo:           str   # 'indisponivel' | 'prefere_nao'

class DisponibilidadeCreate(DisponibilidadeBase): pass

class DisponibilidadeOut(DisponibilidadeBase):
    id: int
    class Config: from_attributes = True


# ─── Solver ───────────────────────────────────────────────────────────────────
class SolverRequest(BaseModel):
    semestre_id: int

class SlotProposto(BaseModel):
    turma_id:       int
    turma_nome:     str
    disciplina_id:  int
    disciplina_nome:str
    professor_id:   int
    professor_nome: str
    sala_id:        Optional[int] = None
    dia_semana:     str
    horario_inicio: str
    horario_fim:    str

class SolverResponse(BaseModel):
    status:    str          # 'ok' | 'parcial' | 'inviavel'
    slots:     list[SlotProposto]
    conflitos: list[str]
    stats:     dict
