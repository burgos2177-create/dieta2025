import { useMemo, useState } from 'react';
import VolumeDashboard from './VolumeDashboard.jsx';
import WorkoutDayCard from './WorkoutDayCard.jsx';
import AddExerciseModal from './AddExerciseModal.jsx';
import TrainingMesocycleModal from './TrainingMesocycleModal.jsx';
import LogDetailModal from '../progression/LogDetailModal.jsx';
import WeekNavigator from '../nutrition/WeekNavigator.jsx';
import { useTrainingStore, selectTrainingDaysForWeek } from '../../store/useTrainingStore.js';
import { getMesoInfoForWeek } from '../../lib/mesocycle.js';
import { showToast } from '../ui/Toast.jsx';

export default function TrainingPage() {
  const {
    template, weeks, mesocycles, activeMesocycleId, activeWeek,
    setActiveWeek,
    addExercise, updateExercise,
    resetDayToTemplate, saveDayAsTemplate,
    addMesocycle, updateMesocycle, removeMesocycle, setActiveMesocycleId, resetMesoStart,
  } = useTrainingStore();

  const trainingDays = useTrainingStore((s) => selectTrainingDaysForWeek(s, s.activeWeek));

  const [modalOpen, setModalOpen] = useState(false);
  const [modalWeekday, setModalWeekday] = useState(0);
  const [editing, setEditing] = useState(null);
  const [logEx, setLogEx] = useState(null);
  const [mesoOpen, setMesoOpen] = useState(false);

  const mesoInfo = useMemo(
    () => getMesoInfoForWeek(mesocycles, activeMesocycleId, activeWeek),
    [mesocycles, activeMesocycleId, activeWeek]
  );

  const snapshotCount = Object.keys(weeks?.[activeWeek] || {}).length;

  const openAdd = (weekday) => {
    setEditing(null);
    setModalWeekday(weekday);
    setModalOpen(true);
  };
  const openEdit = (weekday, exIdx, ex) => {
    setEditing({ weekday, exIdx, ex });
    setModalWeekday(weekday);
    setModalOpen(true);
  };
  const save = (weekday, payload) => {
    if (editing) {
      ['name', 'tech', 'muscle', 'reps', 'sets', 'weight'].forEach((f) => {
        updateExercise(editing.weekday, editing.exIdx, f, payload[f]);
      });
      showToast('✅ Ejercicio actualizado', 'ok');
    } else {
      addExercise(weekday, payload);
      showToast('✅ Ejercicio agregado', 'ok');
    }
  };

  // Map of "is this weekday a snapshot in current week?"
  const isSnapshot = (weekday) => !!weeks?.[activeWeek]?.[weekday];
  const anySnapshot = trainingDays.some((d) => d.isSnapshot);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-wider">ENTRENAMIENTO</h1>
          <p className="text-muted text-sm">
            Bitácora semanal · auto-log en cada cambio de volumen
            {mesoInfo && (
              <span className="ml-2 text-muted/80">
                · {mesoInfo.meso.name} · sem {mesoInfo.weekNumber}/{mesoInfo.meso.weeks}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => openAdd(0)}
          className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
        >
          ＋ Ejercicio
        </button>
      </div>

      <WeekNavigator
        activeWeek={activeWeek}
        onChange={setActiveWeek}
        snapshotCount={snapshotCount}
        mesoInfo={mesoInfo}
        onOpenMesocycles={() => setMesoOpen(true)}
      />

      {anySnapshot && (
        <div className="text-xs text-muted">
          Esta semana tiene <span className="text-accent">{snapshotCount}</span> día{snapshotCount !== 1 ? 's' : ''} con registro propio.
          Usa los botones por día para volver a la plantilla o promover el snapshot.
        </div>
      )}

      <VolumeDashboard days={trainingDays.map((d) => d.day)} />

      <div className="space-y-4">
        {trainingDays.map(({ weekday, cfg, day, isSnapshot: snap }) => (
          <WorkoutDayCard
            key={weekday}
            weekday={weekday}
            cfg={cfg}
            day={day}
            isSnapshot={snap}
            onAddExercise={openAdd}
            onEditExercise={openEdit}
            onOpenLog={(ex) => setLogEx(ex)}
            onResetDay={() => {
              if (confirm(`¿Borrar el registro de ${cfg.label} de esta semana y volver a la plantilla?`)) {
                resetDayToTemplate(activeWeek, weekday);
                showToast('Registro borrado, vuelve a plantilla');
              }
            }}
            onSaveAsTemplate={() => {
              if (confirm(`¿Guardar este ${cfg.label} como nueva plantilla? Reemplazará la plantilla del día.`)) {
                saveDayAsTemplate(activeWeek, weekday);
                showToast('Plantilla actualizada', 'ok');
              }
            }}
          />
        ))}
      </div>

      <AddExerciseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={save}
        weekday={modalWeekday}
        initial={editing?.ex}
      />

      <LogDetailModal open={!!logEx} onClose={() => setLogEx(null)} exercise={logEx} />

      <TrainingMesocycleModal
        open={mesoOpen}
        onClose={() => setMesoOpen(false)}
        mesocycles={mesocycles}
        activeId={activeMesocycleId}
        currentWeek={activeWeek}
        onCreate={(meso) => { addMesocycle(meso); showToast('Mesociclo creado', 'ok'); }}
        onUpdate={(id, patch) => updateMesocycle(id, patch)}
        onRemove={(id) => { removeMesocycle(id); showToast('Mesociclo eliminado'); }}
        onSetActive={(id) => { setActiveMesocycleId(id); showToast(id ? 'Mesociclo activado' : 'Mesociclo desactivado', 'ok'); }}
        onResetStart={(id, wk) => { resetMesoStart(id, wk); showToast('Inicio reseteado a esta semana', 'ok'); }}
      />
    </div>
  );
}
