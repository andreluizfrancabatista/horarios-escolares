# Importado apenas pelo main.py para garantir que todos os models
# sejam registrados antes do create_all
from app.db.base import Base  # noqa
from app.models.usuario import Usuario  # noqa
from app.models.semestre import Semestre  # noqa
from app.models.curso import Curso  # noqa
from app.models.disciplina import Disciplina  # noqa
from app.models.professor import Professor  # noqa
from app.models.sala import Sala  # noqa
from app.models.horario import Horario  # noqa
