from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]


class Horario(Base):
    __tablename__ = "horarios"

    id = Column(Integer, primary_key=True, index=True)
    semestre_id = Column(Integer, ForeignKey("semestres.id"), nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("professores.id"), nullable=True)
    sala_id = Column(Integer, ForeignKey("salas.id"), nullable=True)

    dia_semana = Column(String(10), nullable=False)   # Segunda … Sexta
    horario_inicio = Column(String(5), nullable=False) # "07:00"
    horario_fim = Column(String(5), nullable=False)    # "08:40"

    semestre = relationship("Semestre", back_populates="horarios")
    curso = relationship("Curso", back_populates="horarios")
    disciplina = relationship("Disciplina", back_populates="horarios")
    professor = relationship("Professor", back_populates="horarios")
    sala = relationship("Sala", back_populates="horarios")

    # Restrições de unicidade:
    # 1. Professor não pode ter 2 aulas no mesmo dia/horário
    # 2. Sala não pode ter 2 aulas no mesmo dia/horário
    # 3. Curso não pode ter 2 aulas no mesmo dia/horário
    __table_args__ = (
        UniqueConstraint("semestre_id", "professor_id", "dia_semana", "horario_inicio",
                         name="uq_professor_slot"),
        UniqueConstraint("semestre_id", "sala_id", "dia_semana", "horario_inicio",
                         name="uq_sala_slot"),
        UniqueConstraint("semestre_id", "curso_id", "dia_semana", "horario_inicio",
                         name="uq_curso_slot"),
    )
