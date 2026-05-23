from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class DisponibilidadeProfessor(Base):
    """
    Disponibilidade de um professor em um slot (dia + horário) para um semestre.
    tipo: 'indisponivel' (rígido — solver nunca aloca)
          'prefere_nao'  (suave — solver evita mas pode usar se necessário)
    Slots não cadastrados são considerados disponíveis.
    """
    __tablename__ = "disponibilidades_professor"

    id           = Column(Integer, primary_key=True, index=True)
    semestre_id  = Column(Integer, ForeignKey("semestres.id"),   nullable=False)
    professor_id = Column(Integer, ForeignKey("professores.id"), nullable=False)
    dia_semana   = Column(String(10), nullable=False)
    horario_inicio = Column(String(5), nullable=False)
    tipo         = Column(String(15), nullable=False)  # 'indisponivel' | 'prefere_nao'

    semestre  = relationship("Semestre")
    professor = relationship("Professor")

    __table_args__ = (
        UniqueConstraint("semestre_id", "professor_id", "dia_semana", "horario_inicio",
                         name="uq_disp_slot"),
    )
