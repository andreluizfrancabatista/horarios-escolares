from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class Horario(Base):
    __tablename__ = "horarios"

    id = Column(Integer, primary_key=True, index=True)
    semestre_id = Column(Integer, ForeignKey("semestres.id"), nullable=False)
    turma_id = Column(Integer, ForeignKey("turmas.id"), nullable=False)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("professores.id"), nullable=True)
    sala_id = Column(Integer, ForeignKey("salas.id"), nullable=True)

    dia_semana = Column(String(10), nullable=False)
    horario_inicio = Column(String(5), nullable=False)
    horario_fim = Column(String(5), nullable=False)

    semestre = relationship("Semestre", back_populates="horarios")
    turma = relationship("Turma", back_populates="horarios")
    disciplina = relationship("Disciplina", back_populates="horarios")
    professor = relationship("Professor", back_populates="horarios")
    sala = relationship("Sala", back_populates="horarios")

    __table_args__ = (
        UniqueConstraint("semestre_id", "professor_id", "dia_semana", "horario_inicio",
                         name="uq_professor_slot"),
        UniqueConstraint("semestre_id", "sala_id", "dia_semana", "horario_inicio",
                         name="uq_sala_slot"),
        UniqueConstraint("semestre_id", "turma_id", "dia_semana", "horario_inicio",
                         name="uq_turma_slot"),
    )
