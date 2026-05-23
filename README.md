# 📅 Horários Escolares

Sistema web de gestão de horários para ensino superior — React + FastAPI + PostgreSQL + OR-Tools.

---

## ✨ Funcionalidades — v2.1 (atual)

### Módulo de Alocação Automática (OR-Tools CP-SAT)

**Regras rígidas implementadas:**
- Cada disciplina recebe exatamente **1 bloco de 4 slots consecutivos** na semana
- Os 4 slots são sempre do **mesmo turno** (Manhã, Tarde ou Noite)
- Turmas com turno **Noite** → somente blocos noturnos (18:10–21:30)
- Turmas com turno **Manhã** ou **Tarde** → somente blocos diurnos (07:00–17:10)
- Turmas com turno **Integral** → qualquer turno
- Sem conflitos de professor, sala ou turma
- Respeita disponibilidade `indisponivel` do professor (nunca aloca)

**Regras suaves (minimizadas):**
- Evita slots `prefere_nao` do professor (peso 10)
- Distribui blocos de mesma turma em dias diferentes (peso 5)
- Minimiza janelas no dia do professor (peso 3)

**Importação CSV nas abas do módulo:**

| Arquivo | Colunas |
|---------|---------|
| `alocacoes.csv` | `professor_nome`, `disciplina_nome`, `turma_codigo` |
| `disponibilidades.csv` | `professor_nome`, `dia_semana`, `horario_inicio`, `tipo` |

Valores de `tipo`: `indisponivel` (rígido) ou `prefere_nao` (suave).
Dias válidos: `Segunda`, `Terça`, `Quarta`, `Quinta`, `Sexta`.

### Fluxo de uso do módulo automático

```
1. Cadastrar turmas com turno correto (Manhã/Tarde/Noite/Integral)
2. /auto → Aba 1: alocar professor → disciplina → turma
   (ou importar alocacoes.csv)
3. /auto → Aba 2: preencher disponibilidade de cada professor
   (ou importar disponibilidades.csv)
4. /auto → Aba 3: clicar "Gerar grade automaticamente"
5. Revisar proposta → "Aceitar e importar" ou ajustar manualmente
```

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

> Após mudanças no modelo: `docker compose down -v && docker compose up -d --build`

---

## 🖼️ Favicon

Substitua `frontend/public/favicon.ico` e rode `docker compose up -d --build frontend`.

---

## 📁 Estrutura relevante

```
backend/app/services/solver.py
  BLOCOS_POR_TURNO   blocos de 4 slots consecutivos por turno
  _turnos_permitidos restrição turno da turma
  rodar_solver       modelo CP-SAT completo
  _diagnostico       heurística de diagnóstico de inviabilidade

backend/app/api/routes/bulk.py
  /bulk/alocacoes?semestre_id=N       CSV professor→disciplina→turma
  /bulk/disponibilidades?semestre_id=N CSV disponibilidades por slot

frontend/src/pages/AutoPage.jsx
  AbaAlocacoes        + botão importar CSV
  AbaDisponibilidades + botão importar CSV
  AbaSolver           executa e exibe proposta
```

---

## 🛣️ Roadmap

| Versão | Status |
|--------|--------|
| v1.x | Gestão manual, bulk CSV, temas, grade pública ✅ |
| v2.0 | Alocação automática OR-Tools básica ✅ |
| v2.1 | Blocos de 4 consecutivos, restrição de turno por turma, CSV de alocações e disponibilidades ✅ |
| v2.2 | Exportação PDF/Excel |
| v2.3 | Link público para professor preencher disponibilidade |

---

## 📄 Licença

MIT
