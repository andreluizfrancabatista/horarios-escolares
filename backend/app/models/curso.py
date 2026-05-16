from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    codigo = Column(String(20), unique=True, nullable=False)
    turno = Column(String(20), nullable=False)   # Manhã / Tarde / Noite / Integral

    disciplinas = relationship("Disciplina", back_populates="curso")
    horarios = relationship("Horario", back_populates="curso")
