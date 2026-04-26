import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DAYS = ['月', '火', '水', '木', '金'];

// 科目インデックス → 色ファミリー（赤・青・緑）
// クラスインデックス → 同ファミリー内で淡→濃
const SUBJECT_PALETTES = [
  // 赤系（rose）
  [
    { bg: '#ffe4e6', border: '#fda4af', text: '#9f1239' },
    { bg: '#fecdd3', border: '#fb7185', text: '#881337' },
    { bg: '#fda4af', border: '#f43f5e', text: '#7f1d1d' },
    { bg: '#fb7185', border: '#e11d48', text: '#fff1f2' },
  ],
  // 青系（sky）
  [
    { bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e' },
    { bg: '#bae6fd', border: '#38bdf8', text: '#0c4a6e' },
    { bg: '#7dd3fc', border: '#0ea5e9', text: '#0c4a6e' },
    { bg: '#38bdf8', border: '#0284c7', text: '#fff'    },
  ],
  // 緑系（emerald）
  [
    { bg: '#d1fae5', border: '#6ee7b7', text: '#064e3b' },
    { bg: '#a7f3d0', border: '#34d399', text: '#064e3b' },
    { bg: '#6ee7b7', border: '#10b981', text: '#064e3b' },
    { bg: '#34d399', border: '#059669', text: '#fff'    },
  ],
];

const MEETING_COLOR = { bg: '#fef9c3', border: '#fde68a', text: '#92400e' };
const FREE_COLOR    = { bg: '#f1f5f9', border: '#e2e8f0', text: '#94a3b8' };

function getCellColor(subjectId, classId, subjects, classes, subjectClassLinks) {
  const subjectIdx = subjects.findIndex(s => s.id === subjectId);
  if (subjectIdx < 0) return SUBJECT_PALETTES[0][0];

  const palette = SUBJECT_PALETTES[subjectIdx % SUBJECT_PALETTES.length];

  // このsubjectに紐づくクラスをglobal classes順で並べる
  const linkedIds = new Set(
    subjectClassLinks.filter(l => l.subjectId === subjectId).map(l => l.classId)
  );
  const linkedClasses = classes.filter(c => linkedIds.has(c.id));
  const classIdx = linkedClasses.findIndex(c => c.id === classId);

  return palette[Math.max(classIdx, 0) % palette.length];
}

// ---- CellEditor ----
function CellEditor({ day, period, cell, subjects, classes, subjectClassLinks, onSave, onClose }) {
  const [type, setType] = useState(cell?.type || 'free');
  const [subjectId, setSubjectId] = useState(cell?.subjectId || '');
  const [classId, setClassId] = useState(cell?.classId || '');
  const [meetingName, setMeetingName] = useState(cell?.name || '');

  const linkedClasses = subjectId
    ? classes.filter(c => subjectClassLinks.some(l => l.subjectId === subjectId && l.classId === c.id))
    : classes;

  function handleSave() {
    if (type === 'lesson') {
      if (!subjectId || !classId) return;
      onSave({ type: 'lesson', subjectId, classId });
    } else if (type === 'meeting') {
      if (!meetingName.trim()) return;
      onSave({ type: 'meeting', name: meetingName.trim() });
    } else {
      onSave({ type: 'free' });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl p-5 w-80 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-800">{day}曜 {period}限</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">種別</label>
          <div className="flex gap-2">
            {[
              { value: 'lesson', label: '授業' },
              { value: 'meeting', label: '会議・公務' },
              { value: 'free', label: '空き' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                  type === opt.value
                    ? 'text-white border-transparent'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                style={type === opt.value ? { backgroundColor: '#0d9488', borderColor: '#0d9488' } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {type === 'lesson' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">科目</label>
              <select
                value={subjectId}
                onChange={e => { setSubjectId(e.target.value); setClassId(''); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">選択してください</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">クラス</label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">選択してください</option>
                {linkedClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
              {subjectId && linkedClasses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">この科目に紐付いたクラスがありません</p>
              )}
            </div>
          </>
        )}

        {type === 'meeting' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">名称</label>
            <input
              autoFocus
              value={meetingName}
              onChange={e => setMeetingName(e.target.value)}
              placeholder="例：公務分掌会議"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            キャンセル
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2 text-sm rounded-lg text-white font-medium"
            style={{ backgroundColor: '#0d9488' }}>
            設定する
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- TimetableCell ----
function TimetableCell({ day, period, cell, subjects, classes, subjectClassLinks, onClick }) {
  const subject = cell?.subjectId ? subjects.find(s => s.id === cell.subjectId) : null;
  const cls = cell?.classId ? classes.find(c => c.id === cell.classId) : null;

  let colors;
  if (cell?.type === 'lesson' && cell.subjectId) {
    colors = getCellColor(cell.subjectId, cell.classId, subjects, classes, subjectClassLinks);
  } else if (cell?.type === 'meeting') {
    colors = MEETING_COLOR;
  } else {
    colors = FREE_COLOR;
  }

  return (
    <button
      onClick={onClick}
      className="w-full h-full min-h-[40px] sm:min-h-[56px] rounded-lg border text-xs transition-all hover:opacity-80 hover:shadow-sm flex flex-col items-center justify-center gap-0.5 p-0.5 sm:p-1"
      style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
    >
      {cell?.type === 'lesson' && subject ? (
        <>
          <span className="font-semibold leading-tight text-center">{subject.name}</span>
          {cls && <span className="opacity-80 leading-tight">{cls.displayName}</span>}
        </>
      ) : cell?.type === 'meeting' ? (
        <span className="font-medium leading-tight text-center px-0.5">{cell.name}</span>
      ) : (
        <span className="opacity-40">−</span>
      )}
    </button>
  );
}

// ---- メイン ----
export default function TimetableGrid() {
  const { state, dispatch } = useApp();
  const { timetable, periodsPerDay, subjects, classes, subjectClassLinks } = state;
  const [editing, setEditing] = useState(null);

  const periods = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

  function getCell(day, period) {
    return timetable?.[day]?.[String(period)] || { type: 'free' };
  }

  function handleSaveCell(day, period, cell) {
    dispatch({ type: 'SET_TIMETABLE_CELL', day, period: String(period), cell });
    setEditing(null);
  }

  function handlePeriodChange(val) {
    const n = Math.max(1, Math.min(8, Number(val)));
    dispatch({ type: 'SET_PERIODS_PER_DAY', value: n });
  }

  // 凡例：科目ごとに紐づくクラスの色スウォッチを生成
  const legendItems = subjects.map((subject, sIdx) => {
    const palette = SUBJECT_PALETTES[sIdx % SUBJECT_PALETTES.length];
    const linkedIds = new Set(
      subjectClassLinks.filter(l => l.subjectId === subject.id).map(l => l.classId)
    );
    const linkedClasses = classes.filter(c => linkedIds.has(c.id));
    return { subject, palette, linkedClasses };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-700">週時間割</h3>
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-slate-400" />
          <label className="text-xs text-slate-500">時限数</label>
          <input
            type="number"
            min={1}
            max={8}
            value={periodsPerDay}
            onChange={e => handlePeriodChange(e.target.value)}
            className="w-14 border border-slate-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
      </div>

      <div>
        <div>
          {/* ヘッダー */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `max(24px, 5vw) repeat(${DAYS.length}, 1fr)` }}>
            <div />
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 py-1">
                {day}曜
              </div>
            ))}
          </div>

          {/* 時限行 */}
          <div className="space-y-1">
            {periods.map(period => (
              <div key={period}>
                {period === 5 && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                    <span className="text-xs text-slate-400 font-medium px-1 whitespace-nowrap">午後</span>
                    <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                  </div>
                )}
                <div className="grid gap-1 items-center" style={{ gridTemplateColumns: `max(24px, 5vw) repeat(${DAYS.length}, 1fr)` }}>
                  <div className="text-center text-xs font-bold text-slate-400">{period}限</div>
                  {DAYS.map(day => (
                    <TimetableCell
                      key={day}
                      day={day}
                      period={period}
                      cell={getCell(day, period)}
                      subjects={subjects}
                      classes={classes}
                      subjectClassLinks={subjectClassLinks}
                      onClick={() => setEditing({ day, period })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-4 space-y-2">
        {legendItems.map(({ subject, palette, linkedClasses }) => (
          <div key={subject.id} className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600 w-20 shrink-0">{subject.name}</span>
            {linkedClasses.length === 0 ? (
              <span className="text-xs text-slate-400">（クラス未設定）</span>
            ) : (
              linkedClasses.map((cls, cIdx) => {
                const color = palette[cIdx % palette.length];
                return (
                  <div key={cls.id} className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.bg, borderColor: color.border }}
                    />
                    <span className="text-xs text-slate-500">{cls.displayName}</span>
                  </div>
                );
              })
            )}
          </div>
        ))}
        {/* 固定凡例 */}
        <div className="flex gap-4 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: MEETING_COLOR.bg, borderColor: MEETING_COLOR.border }} />
            <span className="text-xs text-slate-500">会議・公務</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: FREE_COLOR.bg, borderColor: FREE_COLOR.border }} />
            <span className="text-xs text-slate-500">空きコマ</span>
          </div>
          <span className="text-xs text-slate-400 ml-auto">※ セルをクリックして編集</span>
        </div>
      </div>

      {editing && (
        <CellEditor
          day={editing.day}
          period={editing.period}
          cell={getCell(editing.day, editing.period)}
          subjects={subjects}
          classes={classes}
          subjectClassLinks={subjectClassLinks}
          onSave={(cell) => handleSaveCell(editing.day, editing.period, cell)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
