from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import relationship
from app.db.base import Base


class Semestre(Base):
    __tablename__ = "semestres"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), nullable=False)          # ex: "2025/1"
    data_inicio = Column(Date, nullable=True)
    data_fim = Column(Date, nullable=True)
    ativo = Column(Boolean, default=False)              # apenas 1 semestre ativo por vez

    horarios = relationship("Horario", back_populates="semestre", cascade="all, delete-orphan")
