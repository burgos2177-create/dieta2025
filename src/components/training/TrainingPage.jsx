import { useMemo, useState } from 'react';
import VolumeDashboard from './VolumeDashboard.jsx';
import WorkoutDayCard from './WorkoutDayCard.jsx';
import AddExerciseModal from './AddExerciseModal.jsx';
import TrainingMesocycleModal from './TrainingMesocycleModal.jsx';
import SaveWorkoutPresetModal from './SaveWorkoutPresetModal.jsx';
import ApplyWorkoutPresetModal from './ApplyWorkoutPresetModal.jsx';
import WorkoutPresetsManagerModal from './WorkoutPresetsManagerModal.jsx';
import LogDetailModal from '../progression/LogDetailModal.jsx';
import WeekNavigator from '../nutrition/WeekNavigator.jsx';
import { useTrainingStore, selectTrainingDaysForWeek, selectTrainingDay, findMatchingWorkoutPreset } from '../../store/useTrainingStore.js';
import { useNutritionStore } from '../../store/useNutritionStore.js';
import { useProfileStore } from '../../store/useProfileStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { getMesoInfoForWeek } from '../../lib/mesocycle.js';
import { buildMesocyclePrintHTML } from '../../lib/printTraining.js';
import { TR_DAYS_CONFIG, MUSCLE_LABELS } from '../../lib/constants.js';
import { showToast } from '../ui/Toast.jsx';

export default function TrainingPage() {
  const {
    template, weeks, mesocycles, activeMesocycleId, activeWeek,
    workoutPresets,
    setActiveWeek,
    addExercise, updateExercise, updateExerciseFields,
    resetDayToTemplate, saveDayAsTemplate,
    addMesocycle, updateMesocycle, removeMesocycle, setActiveMesocycleId, resetMesoStart,
    saveWorkoutPreset, removeWorkoutPreset, renameWorkoutPreset, applyWorkoutPreset, overwriteWorkoutPreset,
  } = useTrainingStore();

  const trainingDays = useTrainingStore((s) => selectTrainingDaysForWeek(s, s.activeWeek));
  const profile = useProfileStore();
  const currentGym = useUIStore((s) => s.currentGym);
  const setCurrentGym = useUIStore((s) => s.setCurrentGym);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalWeekday, setModalWeekday] = useState(0);
  const [editing, setEditing] = useState(null);
  const [logEx, setLogEx] = useState(null);
  const [mesoOpen, setMesoOpen] = useState(false);
  const [savePresetFor, setSavePresetFor] = useState(null);  // {weekday, label, exercises}
  const [applyPresetFor, setApplyPresetFor] = useState(null); // {weekday, label}
  const [presetsOpen, setPresetsOpen] = useState(false);

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
      updateExerciseFields(editing.weekday, editing.exIdx, {
        name: payload.name,
        tech: payload.tech,
        muscle: payload.muscle,
        reps: Number(payload.reps) || 0,
        sets: Number(payload.sets) || 0,
        weight: Number(payload.weight) || 0,
        equipment: payload.equipment || 'manual',
        equipmentData: payload.equipmentData || {},
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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openAdd(0)}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
          >
            ＋ Ejercicio
          </button>
          <button
            onClick={() => {
              const meso = mesocycles.find((m) => m.id === activeMesocycleId);
              if (!meso) {
                showToast('Activa un mesociclo primero', 'error');
                return;
              }
              const state = useTrainingStore.getState();
              const html = buildMesocyclePrintHTML({
                profile,
                meso,
                trCfgs: TR_DAYS_CONFIG,
                selectDay: (wk, wd) => selectTrainingDay(state, wk, wd),
                muscleLabels: MUSCLE_LABELS,
              });
              const win = window.open('', '_blank', 'width=820,height=1000');
              if (!win) {
                showToast('Permite ventanas emergentes para imprimir', 'error');
                return;
              }
              win.document.open();
              win.document.write(html);
              win.document.close();
              win.focus();
              setTimeout(() => { try { win.print(); } catch (_) {} }, 350);
            }}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white hover:border-white/30 transition"
            title="Imprimir el mesociclo activo"
          >
            🖨 PDF Mesociclo
          </button>
        </div>
      </div>

      <WeekNavigator
        activeWeek={activeWeek}
        onChange={(wk) => {
          setActiveWeek(wk);
          if (useUIStore.getState().syncWeek) {
            useNutritionStore.getState().setActiveWeek(wk);
          }
        }}
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
            matchingPreset={findMatchingWorkoutPreset(workoutPresets, day?.exercises || [])}
            hasAnyPresets={workoutPresets.length > 0}
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
            onApplyPreset={(wd, label) => setApplyPresetFor({ weekday: wd, label })}
            onSavePreset={(wd, label, exercises) => setSavePresetFor({ weekday: wd, label, exercises })}
          />
        ))}
      </div>

      {/* Footer: presets manager */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setPresetsOpen(true)}
          className="flex-1 border border-border bg-white/[0.02] hover:bg-white/[0.05] rounded-lg py-3 text-sm text-white transition"
        >
          📋 Gestionar presets de rutina ({workoutPresets.length})
        </button>
      </div>

      <AddExerciseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={save}
        weekday={modalWeekday}
        initial={editing?.ex}
      />

      <LogDetailModal open={!!logEx} onClose={() => setLogEx(null)} exercise={logEx} />

      <SaveWorkoutPresetModal
        open={!!savePresetFor}
        onClose={() => setSavePresetFor(null)}
        exercises={savePresetFor?.exercises}
        dayLabel={savePresetFor?.label}
        existingPresets={workoutPresets}
        matchingPresetId={
          findMatchingWorkoutPreset(workoutPresets, savePresetFor?.exercises || [])?.id || null
        }
        defaultGym={currentGym}
        defaultMesoWeek={mesoInfo?.weekNumber || null}
        defaultMesoWeeks={mesoInfo?.meso?.weeks || 5}
        defaultBodyWeightKg={Number(profile.peso) || null}
        onSubmit={(payload) => {
          saveWorkoutPreset(payload);
          if (payload.gym) setCurrentGym(payload.gym);
          showToast('Preset de rutina guardado', 'ok');
        }}
        onOverwrite={(id, payload) => {
          overwriteWorkoutPreset(id, payload);
          if (payload.gym) setCurrentGym(payload.gym);
          showToast('Preset sobrescrito', 'ok');
        }}
      />

      <ApplyWorkoutPresetModal
        open={!!applyPresetFor}
        onClose={() => setApplyPresetFor(null)}
        presets={workoutPresets}
        dayLabel={applyPresetFor?.label}
        defaultGym={currentGym}
        defaultMesoWeek={mesoInfo?.weekNumber || null}
        onApply={(presetId, mode) => {
          applyWorkoutPreset(applyPresetFor.weekday, presetId, mode);
          showToast(mode === 'replace' ? 'Preset aplicado (reemplazado)' : 'Preset aplicado', 'ok');
        }}
      />

      <WorkoutPresetsManagerModal
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        presets={workoutPresets}
        onRename={(id, name) => { renameWorkoutPreset(id, name); showToast('Preset renombrado'); }}
        onRemove={(id) => { removeWorkoutPreset(id); showToast('Preset eliminado'); }}
        onUpdate={(id, patch) => overwriteWorkoutPreset(id, patch)}
      />

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
