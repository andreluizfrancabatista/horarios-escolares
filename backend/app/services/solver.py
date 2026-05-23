"""
Solver de horários — Google OR-Tools CP-SAT

Turnos e slots (cada turno tem exatamente 4 slots consecutivos):
  Manhã:  08:00, 08:50, 10:00, 10:50
  Tarde:  13:10, 14:00, 15:10, 16:00
  Noite:  19:00, 19:50, 21:00, 21:50

Regras de turno por tipo de curso:
  Manhã    → só blocos do turno Manhã
  Tarde    → só blocos do turno Tarde
  Integral → blocos de Manhã OU Tarde  (nunca Noite)
  Noite    → só blocos do turno Noite

Regras rígidas:
  1. Cada alocação recebe exatamente 1 bloco de 4 slots (o bloco inteiro, no mesmo dia)
  2. Turno respeitado conforme acima
  3. Professor sem sobreposição
  4. Turma sem sobreposição
  5. Sala sem sobreposição
  6. Slots 'indisponivel' bloqueados para o professor

Regras suaves:
  7. Evitar slots 'prefere_nao'                       (peso 10)
  8. Não repetir turma no mesmo dia                   (peso  5)
  9. Minimizar janelas no dia do professor             (peso  3)
 10. Honrar sala preferida da alocação               (peso  1 — penaliza só se não conseguir)
"""

from sqlalchemy.orm import Session
from app.models.alocacao import AlocacaoProfessor
from app.models.disponibilidade import DisponibilidadeProfessor
from app.models.sala import Sala
from app.schemas.schemas import SolverResponse, SlotProposto

# ── Slots por turno (exatamente 4 cada) ──────────────────────────────────────
TURNOS_SLOTS = {
    "Manhã": ["08:00", "08:50", "10:00", "10:50"],
    "Tarde": ["13:10", "14:00", "15:10", "16:00"],
    "Noite": ["19:00", "19:50", "21:00", "21:50"],
}

# Mapa slot → turno (para diagnóstico)
SLOT_TURNO = {s: t for t, slots in TURNOS_SLOTS.items() for s in slots}

DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

# Índice global de slots (para o mapa de disponibilidade)
ALL_SLOTS = []
for t in ("Manhã", "Tarde", "Noite"):
    ALL_SLOTS.extend(TURNOS_SLOTS[t])

# Horário fim de cada slot (50 min depois)
SLOT_FIM = {}
for s in ALL_SLOTS:
    h, m = map(int, s.split(":"))
    total = h * 60 + m + 50
    SLOT_FIM[s] = f"{total // 60:02d}:{total % 60:02d}"


def _turnos_permitidos(turno_turma: str) -> list:
    """Retorna os nomes de turno permitidos para a turma."""
    if turno_turma == "Noite":
        return ["Noite"]
    if turno_turma == "Manhã":
        return ["Manhã"]
    if turno_turma == "Tarde":
        return ["Tarde"]
    # Integral = Manhã ou Tarde, nunca Noite
    return ["Manhã", "Tarde"]


# ALL_BLOCOS: list of (dia_idx, turno_nome, [slot0, slot1, slot2, slot3])
# Cada turno tem exatamente 4 slots → há apenas 1 bloco possível por turno por dia
ALL_BLOCOS = []
for d_idx in range(len(DIAS)):
    for turno, slots in TURNOS_SLOTS.items():
        ALL_BLOCOS.append((d_idx, turno, slots))

B = len(ALL_BLOCOS)  # 5 dias × 3 turnos = 15 blocos possíveis


# ── Solver principal ──────────────────────────────────────────────────────────

def rodar_solver(semestre_id: int, db: Session) -> SolverResponse:
    try:
        from ortools.sat.python import cp_model as _cp
    except ImportError:
        return SolverResponse(
            status="inviavel", slots=[], stats={},
            conflitos=["OR-Tools não instalado. Verifique os logs do backend."],
        )

    # 1. Dados
    alocacoes = (db.query(AlocacaoProfessor)
                   .filter(AlocacaoProfessor.semestre_id == semestre_id)
                   .all())
    if not alocacoes:
        return SolverResponse(
            status="inviavel", slots=[], stats={},
            conflitos=["Nenhuma alocação professor→disciplina→turma cadastrada."],
        )

    disponibilidades = (db.query(DisponibilidadeProfessor)
                          .filter(DisponibilidadeProfessor.semestre_id == semestre_id)
                          .all())

    salas = db.query(Sala).filter(Sala.ativa == True).all()
    if not salas:
        return SolverResponse(
            status="inviavel", slots=[], stats={},
            conflitos=["Nenhuma sala ativa cadastrada."],
        )

    A = len(alocacoes)
    R = len(salas)
    sala_ids  = [s.id for s in salas]
    sala_idx  = {s.id: i for i, s in enumerate(salas)}

    # Mapa disponibilidade: (prof_id, dia_idx, slot_str) → tipo
    disp_map = {}
    for d in disponibilidades:
        if d.dia_semana in DIAS and d.horario_inicio in ALL_SLOTS:
            disp_map[(d.professor_id, DIAS.index(d.dia_semana), d.horario_inicio)] = d.tipo

    # Índice de sala preferida por alocação (-1 = sem preferência)
    sala_pref = []
    for al in alocacoes:
        pref = getattr(al, 'sala_id', None)
        sala_pref.append(sala_idx.get(pref, -1) if pref else -1)

    # Blocos válidos por alocação
    def blocos_validos(al):
        permitidos = set(_turnos_permitidos(al.turma.turno))
        result = []
        for b_idx, (d_idx, turno, slots) in enumerate(ALL_BLOCOS):
            if turno not in permitidos:
                continue
            bloqueado = any(
                disp_map.get((al.professor_id, d_idx, s)) == "indisponivel"
                for s in slots
            )
            if not bloqueado:
                result.append(b_idx)
        return result

    blocos_por_al = [blocos_validos(al) for al in alocacoes]

    # Verificação rápida
    sem_bloco = [
        f"Prof. {al.professor.nome} / {al.disciplina.nome} / {al.turma.nome}: "
        f"nenhum bloco disponível no turno '{al.turma.turno}'."
        for i, al in enumerate(alocacoes) if not blocos_por_al[i]
    ]
    if sem_bloco:
        return SolverResponse(status="inviavel", slots=[], stats={}, conflitos=sem_bloco)

    # 2. Modelo
    model = _cp.CpModel()

    # y[a, b, r] = alocação a no bloco b na sala r
    y = {}
    for a in range(A):
        for b in blocos_por_al[a]:
            for r in range(R):
                y[a, b, r] = model.new_bool_var(f"y_{a}_{b}_{r}")

    # H1: cada alocação usa exatamente 1 bloco em 1 sala
    for a in range(A):
        model.add(sum(y[a, b, r]
                      for b in blocos_por_al[a]
                      for r in range(R)) == 1)

    # Índices por professor e turma
    prof_als  = {}
    turma_als = {}
    for a, al in enumerate(alocacoes):
        prof_als.setdefault(al.professor_id, []).append(a)
        turma_als.setdefault(al.turma_id,    []).append(a)

    # H3/H4/H5: sem sobreposição (professor, turma, sala) em (dia, slot)
    for d_idx in range(len(DIAS)):
        for turno, slots in TURNOS_SLOTS.items():
            for slot in slots:
                # H3: professor
                for pid, als in prof_als.items():
                    vs = [y[a, b, r]
                          for a in als
                          for b in blocos_por_al[a]
                          for r in range(R)
                          if ALL_BLOCOS[b][0] == d_idx
                          and ALL_BLOCOS[b][1] == turno
                          and (a, b, r) in y]
                    if len(vs) > 1:
                        model.add(sum(vs) <= 1)

                # H4: turma
                for tid, als in turma_als.items():
                    vs = [y[a, b, r]
                          for a in als
                          for b in blocos_por_al[a]
                          for r in range(R)
                          if ALL_BLOCOS[b][0] == d_idx
                          and ALL_BLOCOS[b][1] == turno
                          and (a, b, r) in y]
                    if len(vs) > 1:
                        model.add(sum(vs) <= 1)

                # H5: sala
                for r in range(R):
                    vs = [y[a, b, r]
                          for a in range(A)
                          for b in blocos_por_al[a]
                          if ALL_BLOCOS[b][0] == d_idx
                          and ALL_BLOCOS[b][1] == turno
                          and (a, b, r) in y]
                    if len(vs) > 1:
                        model.add(sum(vs) <= 1)

    # 3. Penalidades
    penalidades = []

    # S1: prefere_nao
    for a, al in enumerate(alocacoes):
        for b in blocos_por_al[a]:
            d_idx, turno, slots = ALL_BLOCOS[b]
            n = sum(1 for s in slots
                    if disp_map.get((al.professor_id, d_idx, s)) == "prefere_nao")
            if n:
                uso = model.new_bool_var(f"pref_{a}_{b}")
                model.add(sum(y[a, b, r] for r in range(R)
                              if (a, b, r) in y) == uso)
                penalidades.append(uso * 10 * n)

    # S2: mesma turma no mesmo dia
    for d_idx in range(len(DIAS)):
        for tid, als in turma_als.items():
            vs_dia = []
            for a in als:
                for b in blocos_por_al[a]:
                    if ALL_BLOCOS[b][0] == d_idx:
                        v = model.new_bool_var(f"td_{a}_{b}")
                        model.add(sum(y[a, b, r] for r in range(R)
                                      if (a, b, r) in y) == v)
                        vs_dia.append(v)
            if len(vs_dia) > 1:
                exc = model.new_int_var(0, len(vs_dia), f"exc_{tid}_{d_idx}")
                model.add(exc >= sum(vs_dia) - 1)
                penalidades.append(exc * 5)

    # S3: janelas no dia do professor (entre turnos do mesmo dia)
    for d_idx in range(len(DIAS)):
        for pid, als in prof_als.items():
            if len(als) < 2:
                continue
            turno_occ = []
            for turno in ("Manhã", "Tarde", "Noite"):
                b_turno = [b for a in als
                           for b in blocos_por_al[a]
                           if ALL_BLOCOS[b][0] == d_idx
                           and ALL_BLOCOS[b][1] == turno]
                if b_turno:
                    occ = model.new_bool_var(f"occ_{pid}_{d_idx}_{turno}")
                    vs = [y[a, b, r]
                          for a in als
                          for b in blocos_por_al[a]
                          for r in range(R)
                          if ALL_BLOCOS[b][0] == d_idx
                          and ALL_BLOCOS[b][1] == turno
                          and (a, b, r) in y]
                    model.add(sum(vs) >= 1).only_enforce_if(occ)
                    model.add(sum(vs) == 0).only_enforce_if(occ.Not())
                    turno_occ.append(occ)
            # Janela: Manhã ocupada, Tarde livre, Noite ocupada
            if len(turno_occ) == 3:
                janela = model.new_bool_var(f"janela_{pid}_{d_idx}")
                model.add_bool_and([turno_occ[0], turno_occ[1].Not(), turno_occ[2]]).only_enforce_if(janela)
                model.add_bool_or([turno_occ[0].Not(), turno_occ[1], turno_occ[2].Not()]).only_enforce_if(janela.Not())
                penalidades.append(janela * 3)

    # S4: sala preferida (penaliza se não conseguir usar a preferida)
    for a in range(A):
        r_pref = sala_pref[a]
        if r_pref < 0:
            continue
        usa_pref = model.new_bool_var(f"sala_pref_{a}")
        vs_pref = [y[a, b, r_pref]
                   for b in blocos_por_al[a]
                   if (a, b, r_pref) in y]
        if vs_pref:
            model.add(sum(vs_pref) == usa_pref)
            penalidades.append(usa_pref.Not() * 1)  # peso baixo — preferência suave

    if penalidades:
        model.minimize(sum(penalidades))

    # 4. Resolver
    solver = _cp.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    solver.parameters.num_search_workers  = 4
    code = solver.solve(model)

    MAP = {_cp.OPTIMAL:"ok", _cp.FEASIBLE:"parcial",
           _cp.INFEASIBLE:"inviavel", _cp.UNKNOWN:"inviavel"}
    status_str = MAP.get(code, "inviavel")

    if code in (_cp.INFEASIBLE, _cp.UNKNOWN):
        return SolverResponse(
            status="inviavel", slots=[], stats={"status_solver": solver.status_name()},
            conflitos=_diagnostico(alocacoes, blocos_por_al, turma_als),
        )

    # 5. Extrair solução
    slots_propostos = []
    avisos = []
    for a, al in enumerate(alocacoes):
        for b in blocos_por_al[a]:
            for r in range(R):
                if (a, b, r) in y and solver.value(y[a, b, r]):
                    d_idx, turno, slots = ALL_BLOCOS[b]
                    for s in slots:
                        slots_propostos.append(SlotProposto(
                            turma_id=al.turma_id,
                            turma_nome=al.turma.nome,
                            disciplina_id=al.disciplina_id,
                            disciplina_nome=al.disciplina.nome,
                            professor_id=al.professor_id,
                            professor_nome=al.professor.nome,
                            sala_id=sala_ids[r],
                            dia_semana=DIAS[d_idx],
                            horario_inicio=s,
                            horario_fim=SLOT_FIM[s],
                        ))
                        if disp_map.get((al.professor_id, d_idx, s)) == "prefere_nao":
                            avisos.append(
                                f"{al.professor.nome}: {DIAS[d_idx]} {s} "
                                f"(prefere não — necessário para {al.disciplina.nome}/{al.turma.nome})"
                            )
                    # Aviso se sala preferida não foi respeitada
                    r_pref = sala_pref[a]
                    if r_pref >= 0 and r != r_pref:
                        avisos.append(
                            f"{al.disciplina.nome}/{al.turma.nome}: sala preferida indisponível, "
                            f"realocada para {salas[r].nome}."
                        )

    return SolverResponse(
        status=status_str,
        slots=slots_propostos,
        conflitos=list(dict.fromkeys(avisos)),
        stats={
            "status_solver":    solver.status_name(),
            "tempo_segundos":   round(solver.wall_time, 2),
            "penalidade_total": int(solver.objective_value) if penalidades else 0,
            "aulas_alocadas":   len(slots_propostos),
            "aulas_esperadas":  len(alocacoes) * 4,
            "blocos_alocados":  len(slots_propostos) // 4,
        },
    )


def _diagnostico(alocacoes, blocos_por_al, turma_als) -> list:
    msgs = []
    for i, al in enumerate(alocacoes):
        n = len(blocos_por_al[i])
        if n == 0:
            msgs.append(
                f"Prof. {al.professor.nome} / {al.disciplina.nome} / {al.turma.nome}: "
                f"zero blocos disponíveis para turno '{al.turma.turno}'."
            )
        elif n < 3:
            msgs.append(
                f"Prof. {al.professor.nome} / {al.disciplina.nome} / {al.turma.nome}: "
                f"apenas {n} bloco(s) — risco de conflito."
            )
    for tid, als in turma_als.items():
        if len(als) > 5:
            nome = alocacoes[als[0]].turma.nome
            msgs.append(f"Turma '{nome}' tem {len(als)} disciplinas — verifique disponibilidade de blocos.")
    if not msgs:
        msgs.append("Solução inviável. Revise disponibilidades e conflitos entre turmas/professores/salas.")
    return msgs
