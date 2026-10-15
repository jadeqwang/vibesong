# Resume runbook (if the session pauses for the usage window)

Window resets 11:50 PM (2026-10-14). After a pause, resume each unit from its checkpoint:

| Unit | Range / job | Checkpoint |
|---|---|---|
| Team A (engine core owner) | Acts I–II (0–77.76), CORE_REQUESTS.md | engine/checkpoints/teamA.md |
| Team B | Act III (77.76–123.35) + world API | engine/checkpoints/teamB.md |
| Team C | Act IV (123.35–173.02) | engine/checkpoints/teamC.md |
| Team D | Act V + outro + final image (173.02–~207) | engine/checkpoints/teamD.md |
| Cutscene unit | Seedance/Veo bridge cutscenes | media/cutscenes/CHECKPOINT.md |
| Art dept | sheets/sprites (idle) | assets/sheets/NOTES.md |

Collect any paid in-flight jobs first (tools/gen/gen.py status|collect). Review page: https://claude.ai/artifact/NcwA2GhGvBNvHL1r5uyHRE ; decisions in docs/decisions.md.
