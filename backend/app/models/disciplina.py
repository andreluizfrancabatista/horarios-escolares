from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Disciplina(Base):
    __tablename__ = "disciplinas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    codigo = Column(String(20), unique=True, nullable=False)
    carga_horaria = Column(Integer, nullable=False, default=60)   # horas/semestre
    periodo = Column(Integer, nullable=True)                       # período/semestre do curso
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)

    curso = relationship("Curso", back_populates="disciplinas")
    horarios = relationship("Horario", back_populates="disciplina")
