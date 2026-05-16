from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class Professor(Base):
    __tablename__ = "professores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    titulacao = Column(String(50), nullable=True)   # Mestre, Doutor, Especialista...
    departamento = Column(String(100), nullable=True)
    observacoes = Column(Text, nullable=True)

    horarios = relationship("Horario", back_populates="professor")
