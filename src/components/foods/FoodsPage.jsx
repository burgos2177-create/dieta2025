import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import Pill from '../ui/Pill.jsx';
import Modal from '../ui/Modal.jsx';
import { useFoodStore } from '../../store/useFoodStore.js';
import { FOOD_CATEGORIES, SERVING_UNITS } from '../../lib/constants.js';
import { computeFoodMacros } from '../../lib/calculators.js';
import { showToast } from '../ui/Toast.jsx';

const EMPTY_FORM = {
  id: '', name: '', brand: '', category: 'lacteos',
  servingSize: 100, servingUnit: 'g',
  kcal: 0, prot: 0, carb: 0, fat: 0,
  fiber: 0, sugar: 0, sodium: 0, notes: '',
};

export default function FoodsPage() {
  const { foods, addFood, updateFood, deleteFood } = useFoodStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('name');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calcFoodId, setCalcFoodId] = useState(null);
  const [calcAmount, setCalcAmount] = useState(100);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = foods.filter((f) => {
      const matchCat = cat === 'all' || f.category === cat;
      const matchQ = !qq || f.name.toLowerCase().includes(qq) || (f.brand || '').toLowerCase().includes(qq);
      return matchCat && matchQ;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'kcal') return b.kcal - a.kcal;
      if (sort === 'prot') return b.prot - a.prot;
      return a.name.localeCompare(b.name, 'es');
    });
    return list;
  }, [foods, q, cat, sort]);

  const calcFood = foods.find((f) => f.id === calcFoodId);
  const calcPreview = calcFood ? computeFoodMacros(calcFood, Number(calcAmount) || 0) : null;

  const onSubmit = () => {
    if (!form.name.trim()) return showToast('⚠ Nombre requerido', 'error');
    if (!form.servingSize)  return showToast('⚠ Porción requerida', 'error');
    if (editing) {
      updateFood(form.id, form);
      showToast('✅ Alimento actualizado', 'ok');
    } else {
      addFood(form);
      showToast('✅ Alimento guardado', 'ok');
    }
    setForm(EMPTY_FORM);
    setEditing(false);
    setShowForm(false);
  };

  const onEdit = (f) => {
    setForm(f);
    setEditing(true);
    setShowForm(true);
  };

  const onDelete = (id) => {
    if (!confirm('¿Eliminar este alimento?')) return;
    deleteFood(id);
    showToast('🗑 Alimento eliminado');
  };

  const exportJson = () => {
    const data = JSON.stringify(foods, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dieta2025_foods.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          useFoodStore.getState().replaceAll(parsed);
          showToast('✅ Importados ' + parsed.length + ' alimentos', 'ok');
        }
      } catch {
        showToast('⚠ JSON inválido', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-wider">ALIMENTOS</h1>
          <p className="text-muted text-sm">{foods.length} alimentos en tu base de datos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditing(false); setShowForm(true); }}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
          >
            ＋ Nuevo alimento
          </button>
          <button
            onClick={exportJson}
            className="px-3 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
          >
            ⬇ Export
          </button>
          <label className="px-3 py-2 text-sm rounded-lg border border-border text-muted hover:text-white cursor-pointer">
            ⬆ Import
            <input type="file" accept="application/json" onChange={importJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Search + filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o marca…"
            className="md:col-span-6"
          />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="md:col-span-3">
            <option value="all">Todas las categorías</option>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="md:col-span-3">
            <option value="name">Orden: A-Z</option>
            <option value="kcal">Orden: Kcal ↓</option>
            <option value="prot">Orden: Proteína ↓</option>
          </select>
        </div>
      </Card>

      {/* Portion calculator */}
      <Card title="Calculadora de porción">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label className="text-xs text-muted">Alimento</label>
            <select value={calcFoodId || ''} onChange={(e) => setCalcFoodId(e.target.value)}>
              <option value="">— Selecciona —</option>
              {foods.map((f) => (
                <option key={f.id} value={f.id}>{f.name}{f.brand ? ' · ' + f.brand : ''}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-muted">Cantidad</label>
            <input type="number" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} />
          </div>
          <div className="md:col-span-3 text-right font-mono text-sm">
            {calcPreview ? (
              <div>
                <div className="text-accent text-lg">{calcPreview.kcal.toFixed(0)} kcal</div>
                <div className="text-muted text-xs">
                  P {calcPreview.prot.toFixed(1)} · CH {calcPreview.carb.toFixed(1)} · G {calcPreview.fat.toFixed(1)}
                </div>
              </div>
            ) : <span className="text-muted text-xs">—</span>}
          </div>
        </div>
      </Card>

      {/* Food list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => <FoodCard key={f.id} food={f} onEdit={onEdit} onDelete={onDelete} />)}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar alimento' : 'Nuevo alimento'} maxWidth="max-w-2xl">
        <FoodForm form={form} setForm={setForm} onSubmit={onSubmit} editing={editing} />
      </Modal>
    </div>
  );
}

function FoodCard({ food, onEdit, onDelete }) {
  const total = food.prot * 4 + food.carb * 4 + food.fat * 9;
  const p = total > 0 ? (food.prot * 4) / total : 0;
  const c = total > 0 ? (food.carb * 4) / total : 0;
  const g = total > 0 ? (food.fat  * 9) / total : 0;
  return (
    <Card pad={false} className="flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-lg text-white truncate">{food.name}</div>
            <div className="text-xs text-muted">{food.brand || '—'} · {food.category}</div>
          </div>
          <Pill tone="cyan">{food.kcal} kcal</Pill>
        </div>
        <div className="text-[0.65rem] text-muted mt-1">Porción: {food.servingSize}{food.servingUnit}</div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
          <MacroMini label="P"  value={food.prot} color="text-ok" />
          <MacroMini label="CH" value={food.carb} color="text-accent" />
          <MacroMini label="G"  value={food.fat}  color="text-warn" />
        </div>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden flex bg-white/5">
          <div style={{ width: p * 100 + '%', background: '#22c55e' }} />
          <div style={{ width: c * 100 + '%', background: '#00e5ff' }} />
          <div style={{ width: g * 100 + '%', background: '#f59e0b' }} />
        </div>
        {food.notes && <div className="text-[0.7rem] text-muted mt-2 italic">{food.notes}</div>}
      </div>
      <div className="border-t border-border px-4 py-2 flex justify-end gap-3 text-xs">
        <button onClick={() => onEdit(food)} className="text-muted hover:text-accent">✏️ Editar</button>
        <button onClick={() => onDelete(food.id)} className="text-muted hover:text-bad">🗑 Eliminar</button>
      </div>
    </Card>
  );
}

function MacroMini({ label, value, color }) {
  return (
    <div className="bg-white/[0.03] rounded-md py-1.5">
      <div className={`font-mono text-sm ${color}`}>{value}g</div>
      <div className="text-[0.55rem] uppercase text-muted">{label}</div>
    </div>
  );
}

function FoodForm({ form, setForm, onSubmit, editing }) {
  const upd = (k, v) => setForm({ ...form, [k]: v });
  const n = (k) => (e) => upd(k, e.target.value === '' ? 0 : parseFloat(e.target.value));
  const totalKcalCalc = form.prot * 4 + form.carb * 4 + form.fat * 9;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre *">
          <input type="text" value={form.name} onChange={(e) => upd('name', e.target.value)} />
        </Field>
        <Field label="Marca">
          <input type="text" value={form.brand} onChange={(e) => upd('brand', e.target.value)} />
        </Field>
        <Field label="Categoría">
          <select value={form.category} onChange={(e) => upd('category', e.target.value)}>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Porción">
            <input type="number" value={form.servingSize} onChange={n('servingSize')} />
          </Field>
          <Field label="Unidad">
            <select value={form.servingUnit} onChange={(e) => upd('servingUnit', e.target.value)}>
              {SERVING_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Kcal"><input type="number" value={form.kcal} onChange={n('kcal')} /></Field>
        <Field label="Proteína (g)"><input type="number" step="0.1" value={form.prot} onChange={n('prot')} /></Field>
        <Field label="Carbs (g)"><input type="number" step="0.1" value={form.carb} onChange={n('carb')} /></Field>
        <Field label="Grasas (g)"><input type="number" step="0.1" value={form.fat}  onChange={n('fat')}  /></Field>
        <Field label="Fibra (g)"><input type="number" step="0.1" value={form.fiber} onChange={n('fiber')} /></Field>
        <Field label="Azúcar (g)"><input type="number" step="0.1" value={form.sugar} onChange={n('sugar')} /></Field>
        <Field label="Sodio (mg)"><input type="number" value={form.sodium} onChange={n('sodium')} /></Field>
        <Field label="Kcal teóricas">
          <div className="font-mono text-accent text-sm py-2">{totalKcalCalc.toFixed(0)}</div>
        </Field>
      </div>
      <Field label="Notas">
        <textarea value={form.notes} onChange={(e) => upd('notes', e.target.value)} rows={2} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onSubmit}
          className="px-5 py-2 rounded-lg bg-accent text-black font-semibold hover:brightness-110"
        >
          {editing ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[0.7rem] uppercase tracking-wider text-muted mb-1">{label}</div>
      {children}
    </label>
  );
}
