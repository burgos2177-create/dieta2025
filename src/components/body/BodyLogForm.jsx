import { useEffect, useRef, useState } from 'react';
import { BODY_FIELD_GROUPS, emptyBodyEntry } from '../../lib/bodyFields.js';
import { compressImageFile, useBodyLogStore } from '../../store/useBodyLogStore.js';
import { useProfileStore } from '../../store/useProfileStore.js';
import { showToast } from '../ui/Toast.jsx';
import { parseBodyReport, AUTO_PARSE_ENABLED } from '../../lib/bodyParser.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function BodyLogForm({ editing, onDone }) {
  const addEntry    = useBodyLogStore((s) => s.addEntry);
  const updateEntry = useBodyLogStore((s) => s.updateEntry);
  const setProfile  = useProfileStore((s) => s.setField);

  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState(emptyBodyEntry());
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [syncProfile, setSyncProfile] = useState(true);
  const [expanded, setExpanded] = useState({ composition: true });
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef(null);

  // Load editing entry if provided
  useEffect(() => {
    if (editing) {
      setDate(editing.date || todayISO());
      setData({ ...emptyBodyEntry(), ...editing });
      setImageDataUrl(editing.imageDataUrl || null);
      setExpanded({ composition: true, control: true, segFat: true, segMusc: true, indicators: true });
    }
  }, [editing?.id]);

  const set = (key, val) =>
    setData((s) => ({ ...s, [key]: val === '' ? null : parseFloat(val) }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setImageDataUrl(dataUrl);
      showToast('📸 Imagen cargada y comprimida', 'ok');
      // If the auto-parser is wired, try extracting fields immediately
      if (AUTO_PARSE_ENABLED) await tryAutoParse(dataUrl);
    } catch {
      showToast('⚠ No se pudo procesar la imagen', 'error');
    }
  };

  /**
   * Calls the parser defined in lib/bodyParser.js and merges any extracted
   * fields into the form — without overwriting values the user already
   * typed manually. While the parser stub returns {}, this is a no-op;
   * when a real implementation is plugged in, the form auto-fills.
   */
  const tryAutoParse = async (dataUrl = imageDataUrl) => {
    if (!dataUrl) return showToast('⚠ Sube una imagen primero', 'error');
    setParsing(true);
    try {
      const extracted = await parseBodyReport(dataUrl);
      const keys = Object.keys(extracted || {});
      if (!keys.length) {
        showToast('ℹ Aún no hay parser automático — captura manual', 'error');
      } else {
        setData((prev) => {
          const next = { ...prev };
          keys.forEach((k) => {
            // Don't overwrite values the user already typed
            if (prev[k] == null || prev[k] === '') next[k] = extracted[k];
          });
          return next;
        });
        // Expand all groups so the user can see what was filled
        setExpanded({ composition: true, control: true, segFat: true, segMusc: true, indicators: true });
        showToast(`✨ ${keys.length} campos detectados automáticamente`, 'ok');
      }
    } catch (err) {
      console.error(err);
      showToast('⚠ Error al analizar la imagen', 'error');
    } finally {
      setParsing(false);
    }
  };

  const toggleGroup = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const reset = () => {
    setDate(todayISO());
    setData(emptyBodyEntry());
    setImageDataUrl(null);
    setExpanded({ composition: true });
  };

  const save = () => {
    const entry = { ...data, date, imageDataUrl };
    if (editing?.id) {
      updateEntry(editing.id, entry);
      showToast('✅ Snapshot actualizado', 'ok');
    } else {
      addEntry(entry);
      showToast('✅ Snapshot guardado', 'ok');
    }
    // Optional: sync key profile fields so the rest of the app stays in sync
    if (syncProfile) {
      if (data.peso != null) setProfile('peso', data.peso);
    }
    reset();
    onDone?.();
  };

  return (
    <div className="space-y-4">
      {/* Image upload */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div
          className="w-full sm:w-44 shrink-0 aspect-[3/4] bg-white/[0.02] border border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent/40 transition"
          onClick={() => fileRef.current?.click()}
        >
          {imageDataUrl ? (
            <img src={imageDataUrl} alt="reporte" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-3 text-xs text-muted">
              <div className="text-2xl mb-1">📸</div>
              Subir imagen<br />del reporte
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        <div className="flex-1 space-y-3 w-full">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-[0.7rem] uppercase tracking-wider text-muted mb-1">Fecha</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncProfile}
                  onChange={(e) => setSyncProfile(e.target.checked)}
                  className="w-auto"
                />
                Actualizar peso del perfil
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => tryAutoParse()}
              disabled={!imageDataUrl || parsing}
              className={`px-3 py-1.5 text-xs rounded-md border transition flex items-center gap-1.5 ${
                AUTO_PARSE_ENABLED
                  ? 'bg-accent/15 border-accent/40 text-accent hover:brightness-110'
                  : 'bg-white/[0.02] border-border text-muted'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={
                AUTO_PARSE_ENABLED
                  ? 'Extraer valores de la imagen automáticamente'
                  : 'Parser automático pendiente — por ahora captura manual'
              }
            >
              {parsing ? '⏳ Analizando…' : '✨ Leer automáticamente'}
            </button>
            {!AUTO_PARSE_ENABLED && (
              <span className="text-[0.65rem] text-muted/70 font-mono">
                (parser listo para conectar en lib/bodyParser.js)
              </span>
            )}
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Sube la imagen del reporte (báscula, escaneo, app) y teclea los valores en cada grupo.
            Solo los campos con datos se guardan. Entre más snapshots acumules, más detalladas serán las gráficas.
          </p>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-2">
        {BODY_FIELD_GROUPS.map((group) => {
          const open = expanded[group.id];
          return (
            <div key={group.id} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition text-left"
              >
                <span className="font-display text-sm tracking-wide text-white/90">{group.label}</span>
                <span className="text-muted text-xs">{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-border">
                  {group.items.map((f) => (
                    <label key={f.key} className="block">
                      <div className="text-[0.65rem] uppercase tracking-wider text-muted mb-1 flex justify-between">
                        <span>{f.label}</span>
                        {f.unit && <span className="text-muted/60">{f.unit}</span>}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={data[f.key] ?? ''}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder="—"
                        className="!py-1.5 text-sm font-mono"
                      />
                      {f.ref && (
                        <div className="text-[0.55rem] text-muted/60 mt-0.5 font-mono">
                          ref: {f.ref[0]}–{f.ref[1]}{f.unit}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {editing && (
          <button
            onClick={() => { reset(); onDone?.(); }}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={save}
          className="px-5 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
        >
          {editing ? 'Actualizar snapshot' : 'Guardar snapshot'}
        </button>
      </div>
    </div>
  );
}
