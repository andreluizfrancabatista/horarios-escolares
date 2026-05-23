from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class AlocacaoProfessor(Base):
    """Define quem ministra qual disciplina para qual turma no semestre."""
    __tablename__ = "alocacoes_professor"

    id           = Column(Integer, primary_key=True, index=True)
    semestre_id  = Column(Integer, ForeignKey("semestres.id"),    nullable=False)
    professor_id = Column(Integer, ForeignKey("professores.id"),  nullable=False)
    disciplina_id= Column(Integer, ForeignKey("disciplinas.id"),  nullable=False)
    turma_id     = Column(Integer, ForeignKey("turmas.id"),       nullable=False)

    semestre   = relationship("Semestre")
    professor  = relationship("Professor")
    disciplina = relationship("Disciplina")
    turma      = relationship("Turma")

    __table_args__ = (
        # Um professor pode ministrar a mesma disciplina para turmas diferentes,
        # mas não pode ter a mesma disciplina+turma duas vezes no mesmo semestre
        UniqueConstraint("semestre_id", "disciplina_id", "turma_id",
                         name="uq_alocacao_disc_turma"),
    )
