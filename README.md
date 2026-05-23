# 📅 Horários Escolares

Sistema web de gestão de horários para ensino superior — React + FastAPI + PostgreSQL + OR-Tools.

---

## ✨ Funcionalidades — v2.0 (atual)

### Área administrativa

**Cadastros:** Semestres, Turmas, Disciplinas (globais), Professores, Salas
**Importação CSV em massa** com validação de colunas e remoção em bulk
**Grade manual:** visualização por turma/professor/sala, drag-and-drop, edição inline, multi-slot

### Alocação Automática (OR-Tools) — `/auto`

**Aba 1 — Alocações:** define quem ministra qual disciplina para qual turma no semestre

**Aba 2 — Disponibilidades:** grade visual por professor
- Clique 1× = **Indisponível** (rígido — solver nunca aloca)
- Clique 2× = **Prefere não** (suave — solver evita, mas pode usar se necessário)
- Clique 3× = limpa

**Aba 3 — Solver:**
- Botão "Gerar grade automaticamente" invoca o CP-SAT do OR-Tools
- Exibe resultado: status (ótimo / parcial / inviável), conflitos, grade proposta por turma
- Botão "Aceitar e importar" substitui a grade atual pelos slots gerados
- Admin pode ajustar manualmente após importar

**Regras do solver:**
- 4 aulas/semana por disciplina (rígido)
- Sem conflitos de professor, sala ou turma (rígido)
- Respeita "indisponível" sempre (rígido)
- Minimiza uso de "prefere não" (suave, peso 10)
- Distribui as 4 aulas em dias diferentes (suave, peso 5)
- Minimiza janelas no dia do professor (suave, peso 3)

### Área pública `/grade`

Visualização de horários sem login, com toggle dark/claro (Default ↔ Instituto Federal).

---

## 🚀 Como rodar

```bash
cp .env.example .env
docker compose up -d --build
```

| Recurso | URL |
|---------|-----|
| Admin | http://localhost:8080 |
| Grade pública | http://localhost:8080/grade |
| API Docs | http://localhost:8080/docs |

**Login padrão:** `admin@escola.edu.br` / `admin123`

---

## 🔄 Fluxo de uso do módulo automático

```
1. Cadastrar turmas + disciplinas + professores + salas
2. /auto → Aba 1: alocar professor → disciplina → turma
3. /auto → Aba 2: preencher disponibilidade de cada professor
4. /auto → Aba 3: clicar "Gerar grade automaticamente"
5. Revisar proposta → "Aceitar e importar" ou ajustar manualmente em /horarios
```

---

## 🖼️ Favicon

Substitua `frontend/public/favicon.ico` pelo ícone da sua instituição e rode:
```bash
docker compose up -d --build frontend
```

---

## 📁 Estrutura relevante

```
backend/app/
  models/
    alocacao.py         AlocacaoProfessor (professor→disciplina→turma por semestre)
    disponibilidade.py  DisponibilidadeProfessor (indisponivel | prefere_nao)
  services/
    solver.py           OR-Tools CP-SAT — regras rígidas + suaves + extração de solução
  api/routes/
    alocacoes.py        CRUD de alocações
    disponibilidades.py CRUD + salvar grade completa do professor
    solver.py           POST /rodar, POST /aceitar

frontend/src/pages/
  AutoPage.jsx          3 abas: Alocações, Disponibilidades, Solver
  HorariosPage.jsx      grade manual (aceita resultado do solver para ajuste)
  GradePage.jsx         visualização pública com toggle de tema
```

---

## 🛣️ Roadmap

| Versão | Status |
|--------|--------|
| v1.x | Gestão manual, bulk CSV, temas, grade pública ✅ |
| v2.0 | Alocação automática OR-Tools CP-SAT ✅ |
| v2.1 | Exportação PDF/Excel da grade |
| v2.2 | Link público para professor preencher disponibilidade |

---

## 📄 Licença

MIT
