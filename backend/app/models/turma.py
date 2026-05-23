from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class Turma(Base):
    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    codigo = Column(String(20), unique=True, nullable=False)
    turno = Column(String(20), nullable=False)

    horarios = relationship("Horario", back_populates="turma")
