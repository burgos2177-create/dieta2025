import { useState } from 'react';
import VolumeDashboard from './VolumeDashboard.jsx';
import WorkoutDayCard from './WorkoutDayCard.jsx';
import AddExerciseModal from './AddExerciseModal.jsx';
import LogDetailModal from '../progression/LogDetailModal.jsx';
import { useTrainingStore } from '../../store/useTrainingStore.js';
import { showToast } from '../ui/Toast.jsx';

export default function TrainingPage() {
  const days = useTrainingStore((s) => s.days);
  const addExercise = useTrainingStore((s) => s.addExercise);
  const updateExercise = useTrainingStore((s) => s.updateExercise);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDayIdx, setModalDayIdx] = useState(0);
  const [editing, setEditing] = useState(null); // { dayIdx, exIdx, ex }
  const [logEx, setLogEx] = useState(null);

  const openAdd = (dayIdx) => {
    setEditing(null);
    setModalDayIdx(dayIdx);
    setModalOpen(true);
  };
  const openEdit = (dayIdx, exIdx, ex) => {
    setEditing({ dayIdx, exIdx, ex });
    setModalDayIdx(dayIdx);
    setModalOpen(true);
  };
  const save = (dayIdx, payload) => {
    if (editing) {
      // Update each field individually to trigger auto-log
      ['name', 'tech', 'muscle', 'reps', 'sets', 'weight'].forEach((f) => {
        updateExercise(editing.dayIdx, editing.exIdx, f, payload[f]);
      });
      showToast('✅ Ejercicio actualizado', 'ok');
    } else {
      addExercise(dayIdx, payload);
      showToast('✅ Ejercicio agregado', 'ok');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-wider">ENTRENAMIENTO</h1>
          <p className="text-muted text-sm">3 días · auto-log en cada cambio de volumen</p>
        </div>
        <button
          onClick={() => openAdd(0)}
          className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
        >
          ＋ Ejercicio
        </button>
      </div>

      <VolumeDashboard days={days} />

      <div className="space-y-4">
        {days.map((d, i) => (
          <WorkoutDayCard
            key={i}
            dayIdx={i}
            day={d}
            onAddExercise={openAdd}
            onEditExercise={openEdit}
            onOpenLog={(ex) => setLogEx(ex)}
          />
        ))}
      </div>

      <AddExerciseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={save}
        dayIdx={modalDayIdx}
        initial={editing?.ex}
      />

      <LogDetailModal open={!!logEx} onClose={() => setLogEx(null)} exercise={logEx} />
    </div>
  );
}
