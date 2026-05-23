from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base


class Sala(Base):
    __tablename__ = "salas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), nullable=False)
    tipo = Column(String(50), nullable=True)
    bloco = Column(String(20), nullable=True)
    ativa = Column(Boolean, default=True)

    horarios = relationship("Horario", back_populates="sala")
