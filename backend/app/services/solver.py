"""
Solver de horários usando Google OR-Tools CP-SAT.

Regras rígidas (hard constraints):
  1. Professor não pode dar 2 aulas simultâneas
  2. Turma não pode ter 2 aulas simultâneas
  3. Sala não pode ter 2 aulas simultâneas
  4. Cada alocação (professor+disciplina+turma) precisa de exatamente 4 slots/semana
  5. Slots marcados como 'indisponivel' nunca são usados para o professor

Regras suaves (soft — minimizadas na função objetivo):
  6. Evitar slots 'prefere_nao' (penalidade por slot usado)
  7. Distribuir as 4 aulas em dias diferentes (penalidade por dia repetido)
  8. Minimizar janelas no dia do professor
     (janela = slot vazio entre dois slots ocupados no mesmo dia)
"""

from ortools.sat.python import cp_model
from sqlalchemy.orm import Session
from typing import Optional

from app.models.alocacao import AlocacaoProfessor
from app.models.disponibilidade import DisponibilidadeProfessor
from app.models.sala import Sala
from app.models.horario import Horario
from app.schemas.schemas import SolverResponse, SlotProposto

DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

SLOTS = [
    "07:00", "07:50", "08:40", "09:30", "10:20", "11:10",
    "13:00", "13:50", "14:40", "15:30", "16:20", "17:10",
    "18:10", "19:00", "19:50", "20:40", "21:30",
]

def slot_fim(inicio: str) -> str:
    h, m = map(int, inicio.split(":"))
    total = h * 60 + m + 50
    return f"{total // 60:02d}:{total % 60:02d}"


def rodar_solver(semestre_id: int, db: Session) -> SolverResponse:
    # ── 1. Carregar dados ───────────────────────────────────────────────────────
    alocacoes = db.query(AlocacaoProfessor).filter(
        AlocacaoProfessor.semestre_id == semestre_id
    ).all()

    if not alocacoes:
        return SolverResponse(
            status="inviavel",
            slots=[],
            conflitos=["Nenhuma alocação professor→disciplina→turma cadastrada para este semestre."],
            stats={},
        )

    disponibilidades = db.query(DisponibilidadeProfessor).filter(
        DisponibilidadeProfessor.semestre_id == semestre_id
    ).all()

    salas = db.query(Sala).filter(Sala.ativa == True).all()
    if not salas:
        return SolverResponse(
            status="inviavel",
            slots=[],
            conflitos=["Nenhuma sala ativa cadastrada."],
            stats={},
        )

    # Índices
    A = len(alocacoes)          # número de alocações
    D = len(DIAS)               # 5 dias
    S = len(SLOTS)              # 17 slots
    R = len(salas)              # salas

    sala_ids = [s.id for s in salas]

    # Disponibilidade indexada: (prof_id, dia_idx, slot_idx) → tipo
    disp_map: dict[tuple, str] = {}
    for d in disponibilidades:
        if d.dia_semana in DIAS and d.horario_inicio in SLOTS:
            disp_map[(d.professor_id, DIAS.index(d.dia_semana), SLOTS.index(d.horario_inicio))] = d.tipo

    # ── 2. Modelo CP-SAT ────────────────────────────────────────────────────────
    model = cp_model.CpModel()

    # Variável principal: x[a, d, s, r] = 1 se alocação a está no dia d, slot s, sala r
    x = {}
    for a in range(A):
        for d in range(D):
            for s in range(S):
                for r in range(R):
                    x[a, d, s, r] = model.new_bool_var(f"x_{a}_{d}_{s}_{r}")

    # ── Hard constraints ────────────────────────────────────────────────────────

    # H1: Cada alocação tem exatamente 4 slots na semana
    for a in range(A):
        model.add(
            sum(x[a, d, s, r] for d in range(D) for s in range(S) for r in range(R)) == 4
        )

    # H2: Professor não pode ter 2 aulas no mesmo slot
    prof_ids = [al.professor_id for al in alocacoes]
    for d in range(D):
        for s in range(S):
            profs_unicos = set(prof_ids)
            for pid in profs_unicos:
                alocacoes_prof = [a for a, al in enumerate(alocacoes) if al.professor_id == pid]
                if len(alocacoes_prof) > 1:
                    model.add(
                        sum(x[a, d, s, r] for a in alocacoes_prof for r in range(R)) <= 1
                    )

    # H3: Turma não pode ter 2 aulas no mesmo slot
    turma_ids = [al.turma_id for al in alocacoes]
    for d in range(D):
        for s in range(S):
            turmas_unicas = set(turma_ids)
            for tid in turmas_unicas:
                alocacoes_turma = [a for a, al in enumerate(alocacoes) if al.turma_id == tid]
                if len(alocacoes_turma) > 1:
                    model.add(
                        sum(x[a, d, s, r] for a in alocacoes_turma for r in range(R)) <= 1
                    )

    # H4: Sala não pode ter 2 aulas no mesmo slot
    for d in range(D):
        for s in range(S):
            for r in range(R):
                model.add(
                    sum(x[a, d, s, r] for a in range(A)) <= 1
                )

    # H5: Slots 'indisponivel' são proibidos para o professor
    for a, al in enumerate(alocacoes):
        for d in range(D):
            for s in range(S):
                if disp_map.get((al.professor_id, d, s)) == "indisponivel":
                    for r in range(R):
                        model.add(x[a, d, s, r] == 0)

    # ── Soft constraints (penalidades) ──────────────────────────────────────────
    penalidades = []

    # S1: Penalidade por usar slot 'prefere_nao'
    PESO_PREFERE_NAO = 10
    for a, al in enumerate(alocacoes):
        for d in range(D):
            for s in range(S):
                if disp_map.get((al.professor_id, d, s)) == "prefere_nao":
                    uso = model.new_bool_var(f"pref_{a}_{d}_{s}")
                    model.add(uso == sum(x[a, d, s, r] for r in range(R)))
                    penalidades.append(uso * PESO_PREFERE_NAO)

    # S2: Penalidade por concentrar aulas da mesma alocação no mesmo dia
    PESO_DIA_REPETIDO = 5
    for a in range(A):
        for d in range(D):
            aulas_no_dia = model.new_int_var(0, min(4, S), f"aulas_dia_{a}_{d}")
            model.add(aulas_no_dia == sum(x[a, d, s, r] for s in range(S) for r in range(R)))
            # Penaliza ter mais de 1 aula da mesma disciplina no mesmo dia
            excesso = model.new_int_var(0, 3, f"exc_{a}_{d}")
            model.add(excesso >= aulas_no_dia - 1)
            penalidades.append(excesso * PESO_DIA_REPETIDO)

    # S3: Penalidade por janelas no dia do professor
    PESO_JANELA = 3
    for d in range(D):
        profs_unicos = set(prof_ids)
        for pid in profs_unicos:
            alocacoes_prof = [a for a, al in enumerate(alocacoes) if al.professor_id == pid]
            for s in range(1, S - 1):
                # janela: slot s livre, mas slot s-1 e s+1 ocupados
                antes  = model.new_bool_var(f"antes_{pid}_{d}_{s}")
                depois = model.new_bool_var(f"dep_{pid}_{d}_{s}")
                livre  = model.new_bool_var(f"livre_{pid}_{d}_{s}")
                janela = model.new_bool_var(f"janela_{pid}_{d}_{s}")

                model.add(
                    sum(x[a, d, s-1, r] for a in alocacoes_prof for r in range(R)) >= 1
                ).only_enforce_if(antes)
                model.add(
                    sum(x[a, d, s-1, r] for a in alocacoes_prof for r in range(R)) == 0
                ).only_enforce_if(antes.Not())

                model.add(
                    sum(x[a, d, s+1, r] for a in alocacoes_prof for r in range(R)) >= 1
                ).only_enforce_if(depois)
                model.add(
                    sum(x[a, d, s+1, r] for a in alocacoes_prof for r in range(R)) == 0
                ).only_enforce_if(depois.Not())

                model.add(
                    sum(x[a, d, s, r] for a in alocacoes_prof for r in range(R)) == 0
                ).only_enforce_if(livre)
                model.add(
                    sum(x[a, d, s, r] for a in alocacoes_prof for r in range(R)) >= 1
                ).only_enforce_if(livre.Not())

                model.add_bool_and([antes, depois, livre]).only_enforce_if(janela)
                model.add_bool_or([antes.Not(), depois.Not(), livre.Not()]).only_enforce_if(janela.Not())
                penalidades.append(janela * PESO_JANELA)

    # Minimizar penalidades totais
    if penalidades:
        model.minimize(sum(penalidades))

    # ── 3. Resolver ─────────────────────────────────────────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    solver.parameters.num_search_workers = 4

    status = solver.solve(model)

    status_map = {
        cp_model.OPTIMAL:    "ok",
        cp_model.FEASIBLE:   "parcial",
        cp_model.INFEASIBLE: "inviavel",
        cp_model.UNKNOWN:    "inviavel",
    }
    status_str = status_map.get(status, "inviavel")

    if status in (cp_model.INFEASIBLE, cp_model.UNKNOWN):
        # Tentar identificar conflitos
        conflitos = _identificar_conflitos(alocacoes, disp_map, salas, DIAS, SLOTS)
        return SolverResponse(
            status="inviavel",
            slots=[],
            conflitos=conflitos or ["Não foi possível encontrar solução. Verifique disponibilidades e número de aulas."],
            stats={"status_solver": solver.status_name()},
        )

    # ── 4. Extrair solução ───────────────────────────────────────────────────────
    slots_propostos = []
    for a, al in enumerate(alocacoes):
        for d in range(D):
            for s in range(S):
                for r in range(R):
                    if solver.value(x[a, d, s, r]):
                        slots_propostos.append(SlotProposto(
                            turma_id=al.turma_id,
                            turma_nome=al.turma.nome,
                            disciplina_id=al.disciplina_id,
                            disciplina_nome=al.disciplina.nome,
                            professor_id=al.professor_id,
                            professor_nome=al.professor.nome,
                            sala_id=sala_ids[r],
                            dia_semana=DIAS[d],
                            horario_inicio=SLOTS[s],
                            horario_fim=slot_fim(SLOTS[s]),
                        ))

    # Avisos sobre slots 'prefere_nao' usados
    avisos = []
    for sp in slots_propostos:
        d_idx = DIAS.index(sp.dia_semana)
        s_idx = SLOTS.index(sp.horario_inicio)
        if disp_map.get((sp.professor_id, d_idx, s_idx)) == "prefere_nao":
            avisos.append(
                f"{sp.professor_nome}: {sp.dia_semana} {sp.horario_inicio} "
                f"(prefere não — necessário para {sp.disciplina_nome} / {sp.turma_nome})"
            )

    return SolverResponse(
        status=status_str,
        slots=slots_propostos,
        conflitos=avisos,
        stats={
            "status_solver": solver.status_name(),
            "tempo_segundos": round(solver.wall_time, 2),
            "penalidade_total": int(solver.objective_value) if penalidades else 0,
            "aulas_alocadas": len(slots_propostos),
            "aulas_esperadas": A * 4,
        },
    )


def _identificar_conflitos(alocacoes, disp_map, salas, dias, slots) -> list[str]:
    """Heurística simples para dar dicas sobre por que é inviável."""
    conflitos = []
    n_salas = len(salas)
    n_slots_total = len(dias) * len(slots)

    for al in alocacoes:
        slots_disponiveis = sum(
            1 for d in range(len(dias)) for s in range(len(slots))
            if disp_map.get((al.professor_id, d, s)) != "indisponivel"
        )
        if slots_disponiveis < 4:
            conflitos.append(
                f"Prof. {al.professor.nome}: apenas {slots_disponiveis} slot(s) disponível(is) "
                f"para {al.disciplina.nome} / {al.turma.nome} (necessário: 4)"
            )

    if n_salas == 0:
        conflitos.append("Nenhuma sala ativa disponível.")

    return conflitos
