from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


# ─── Auth ────────────────────────────────────────────────────────────────────

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


# ─── Curso ────────────────────────────────────────────────────────────────────

class CursoBase(BaseModel):
    nome: str
    codigo: str
    turno: str

class CursoCreate(CursoBase): pass
class CursoUpdate(CursoBase): pass

class CursoOut(CursoBase):
    id: int
    class Config: from_attributes = True


# ─── Disciplina ───────────────────────────────────────────────────────────────

class DisciplinaBase(BaseModel):
    nome: str
    codigo: str
    carga_horaria: int = 60
    periodo: Optional[int] = None
    curso_id: int

class DisciplinaCreate(DisciplinaBase): pass
class DisciplinaUpdate(DisciplinaBase): pass

class DisciplinaOut(DisciplinaBase):
    id: int
    curso: Optional[CursoOut] = None
    class Config: from_attributes = True


# ─── Professor ────────────────────────────────────────────────────────────────

class ProfessorBase(BaseModel):
    nome: str
    email: Optional[str] = None
    titulacao: Optional[str] = None
    departamento: Optional[str] = None
    observacoes: Optional[str] = None

class ProfessorCreate(ProfessorBase): pass
class ProfessorUpdate(ProfessorBase): pass

class ProfessorOut(ProfessorBase):
    id: int
    class Config: from_attributes = True


# ─── Sala ─────────────────────────────────────────────────────────────────────

class SalaBase(BaseModel):
    nome: str
    capacidade: int = 40
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
    curso_id: int
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
    curso: Optional[CursoOut] = None
    class Config: from_attributes = True
