from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class AlocacaoProfessor(Base):
    """Define quem ministra qual disciplina para qual turma,
    com sala preferida opcional (suave — solver tenta respeitar)."""
    __tablename__ = "alocacoes_professor"

    id            = Column(Integer, primary_key=True, index=True)
    semestre_id   = Column(Integer, ForeignKey("semestres.id"),   nullable=False)
    professor_id  = Column(Integer, ForeignKey("professores.id"), nullable=False)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id"), nullable=False)
    turma_id      = Column(Integer, ForeignKey("turmas.id"),      nullable=False)
    sala_id       = Column(Integer, ForeignKey("salas.id"),       nullable=True)  # preferida, opcional

    semestre   = relationship("Semestre")
    professor  = relationship("Professor")
    disciplina = relationship("Disciplina")
    turma      = relationship("Turma")
    sala       = relationship("Sala")

    __table_args__ = (
        UniqueConstraint("semestre_id", "disciplina_id", "turma_id",
                         name="uq_alocacao_disc_turma"),
    )
