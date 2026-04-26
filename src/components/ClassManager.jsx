import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Link } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GRADE_SYSTEMS } from '../context/AppContext';

const GROUP_OPTIONS = Array.from({ length: 10 }, (_, i) => `${i + 1}組`);

function ClassForm({ initial, onSave, onCancel, gradeOptions }) {
  const [grade, setGrade] = useState(initial?.grade || gradeOptions[0] || 1);
  const [group, setGroup] = useState(initial?.group || '1組');
  const [lessonClass, setLessonClass] = useState(initial?.lessonClass || '');
  const [displayName, setDisplayName] = useState(initial?.displayName || '');

  const autoName = (g, grp, lc) => `${g}年${lc || grp}`;

  function currentAuto() { return autoName(grade, group, lessonClass); }

  function handleGradeChange(val) {
    const g = Number(val);
    const prev = currentAuto();
    setGrade(g);
    if (!displayName || displayName === prev) {
      setDisplayName(autoName(g, group, lessonClass));
    }
  }

  function handleGroupChange(val) {
    const prev = currentAuto();
    setGroup(val);
    if (!displayName || displayName === prev) {
      setDisplayName(autoName(grade, val, lessonClass));
    }
  }

  function handleLessonClassChange(val) {
    const prev = currentAuto();
    setLessonClass(val);
    if (!displayName || displayName === prev) {
      setDisplayName(autoName(grade, group, val));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      grade,
      group,
      lessonClass: lessonClass.trim(),
      displayName: displayName.trim() || autoName(grade, group),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-lg border space-y-2"
      style={{ backgroundColor: '#f0f4ff', borderColor: '#c0d2ff' }}>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">学年</label>
          <select
            value={grade}
            onChange={e => handleGradeChange(e.target.value)}
            className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {gradeOptions.map(g => <option key={g} value={g}>{g}年</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">組</label>
          <select
            value={group}
            onChange={e => handleGroupChange(e.target.value)}
            className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {GROUP_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">授業クラス</label>
          <input
            value={lessonClass}
            onChange={e => handleLessonClassChange(e.target.value)}
            placeholder="例：A組、特進"
            className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">表示名</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="例：2年1組"
          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md text-slate-500 hover:bg-slate-100">
          <X size={14} /> キャンセル
        </button>
        <button type="submit"
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md text-white"
          style={{ backgroundColor: '#0d9488' }}>
          <Check size={14} /> 保存
        </button>
      </div>
    </form>
  );
}

const DAYS = ['月', '火', '水', '木', '金'];

function TimetablePicker({ subject, cls, timetable, periodsPerDay, onSave, onClose }) {
  const periods = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

  // 現在この科目×クラスが割り当てられているコマを初期選択
  const initialSelected = {};
  for (const day of DAYS) {
    for (const p of periods) {
      const cell = timetable?.[day]?.[String(p)];
      if (cell?.subjectId === subject.id && cell?.classId === cls.id) {
        initialSelected[`${day}-${p}`] = true;
      }
    }
  }
  const [selected, setSelected] = useState(initialSelected);

  function toggle(day, period) {
    const key = `${day}-${period}`;
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    const changes = [];
    for (const day of DAYS) {
      for (const p of periods) {
        const key = `${day}-${p}`;
        const cell = timetable?.[day]?.[String(p)];
        const wasThis = cell?.subjectId === subject.id && cell?.classId === cls.id;
        const isNowSelected = !!selected[key];

        if (isNowSelected && !wasThis) {
          // 新たに割り当て（他の授業は上書き）
          changes.push({ day, period: String(p), cell: { type: 'lesson', subjectId: subject.id, classId: cls.id } });
        } else if (!isNowSelected && wasThis) {
          // 割り当て解除
          changes.push({ day, period: String(p), cell: { type: 'free' } });
        }
      }
    }
    onSave(changes);
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-5 space-y-4 w-auto max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-800">{subject.name} × {cls.displayName}</h4>
            <p className="text-xs text-slate-400 mt-0.5">授業を行うコマをクリックして選択</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none ml-4">×</button>
        </div>

        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-8" />
                {DAYS.map(d => (
                  <th key={d} className="px-3 py-1.5 text-center text-slate-500 font-semibold">{d}曜</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(p => (
                <tr key={p}>
                  <td className="text-center text-slate-400 font-bold pr-2">{p}限</td>
                  {DAYS.map(d => {
                    const key = `${d}-${p}`;
                    const isSelected = !!selected[key];
                    const cell = timetable?.[d]?.[String(p)];
                    const isOther = cell && cell.type === 'lesson' &&
                      !(cell.subjectId === subject.id && cell.classId === cls.id);
                    return (
                      <td key={d} className="p-0.5">
                        <button
                          onClick={() => toggle(d, p)}
                          title={isOther ? '他の授業が入っています（上書きされます）' : ''}
                          className={`w-14 h-9 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'text-white border-transparent'
                              : isOther
                              ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                              : 'bg-slate-50 border-slate-200 text-slate-300 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600'
                          }`}
                          style={isSelected ? { backgroundColor: '#0d9488', borderColor: '#0d9488' } : {}}
                        >
                          {isSelected ? '✓' : isOther ? '他' : '−'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400">{selectedCount}コマ選択中</span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              キャンセル
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 text-sm rounded-lg text-white font-medium"
              style={{ backgroundColor: '#0d9488' }}>
              時間割に反映
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkMatrix({ subjects, classes, links, timetable, periodsPerDay, onToggle, onOpenPicker }) {
  if (subjects.length === 0 || classes.length === 0) return null;

  function getAssignedCount(subjectId, classId) {
    let count = 0;
    for (const day of DAYS) {
      for (let p = 1; p <= periodsPerDay; p++) {
        const cell = timetable?.[day]?.[String(p)];
        if (cell?.subjectId === subjectId && cell?.classId === classId) count++;
      }
    }
    return count;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
        <Link size={14} />
        科目×クラス 担当設定
      </h4>
      <p className="text-xs text-slate-400 mb-2">✓ のセルをクリックすると時間割のコマを直接設定できます</p>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="border border-slate-200 px-2 py-1.5 bg-slate-50 text-left text-slate-600 min-w-[80px]">科目 ＼ クラス</th>
              {classes.map(c => (
                <th key={c.id} className="border border-slate-200 px-2 py-1.5 bg-slate-50 text-slate-600 text-center whitespace-nowrap">
                  {c.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.id}>
                <td className="border border-slate-200 px-2 py-1.5 text-slate-700 whitespace-nowrap font-medium">
                  {s.name}
                </td>
                {classes.map(c => {
                  const linked = links.some(l => l.subjectId === s.id && l.classId === c.id);
                  const count = linked ? getAssignedCount(s.id, c.id) : 0;
                  return (
                    <td key={c.id} className="border border-slate-200 text-center">
                      {linked ? (
                        <button
                          onClick={() => onOpenPicker(s, c)}
                          className="w-full h-full py-1.5 px-2 transition-colors bg-teal-50 hover:bg-teal-100 text-teal-700"
                        >
                          <div className="font-bold">✓</div>
                          {count > 0 && (
                            <div className="text-teal-500 leading-tight" style={{ fontSize: '10px' }}>{count}コマ</div>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggle(s.id, c.id)}
                          className="w-full h-full py-1.5 px-2 transition-colors text-slate-300 hover:bg-slate-50"
                        >
                          −
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClassManager() {
  const { state, dispatch } = useApp();
  const { classes, subjects, subjectClassLinks, timetable, periodsPerDay, gradeSystem = '3' } = state;
  const gradeOptions = GRADE_SYSTEMS[gradeSystem]?.grades || [1, 2, 3];
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null); // { subject, cls }

  function handleAdd(data) {
    dispatch({ type: 'ADD_CLASS', ...data });
    setAdding(false);
  }

  function handleUpdate(data) {
    dispatch({ type: 'UPDATE_CLASS', id: editingId, data });
    setEditingId(null);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_CLASS', id });
    setConfirmDeleteId(null);
  }

  function handleToggleLink(subjectId, classId) {
    dispatch({ type: 'TOGGLE_SUBJECT_CLASS_LINK', subjectId, classId });
  }

  function handleSavePicker(changes) {
    for (const { day, period, cell } of changes) {
      dispatch({ type: 'SET_TIMETABLE_CELL', day, period, cell });
    }
    setPickerTarget(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-700">クラス一覧</h3>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors"
          style={{ backgroundColor: '#0d9488' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f766e'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d9488'}
        >
          <Plus size={14} />
          クラスを追加
        </button>
      </div>

      <div className="space-y-2 min-h-[60px]">
        {classes.length === 0 && !adding && (
          <p className="text-sm text-slate-400 text-center py-6">クラスが登録されていません</p>
        )}
        {classes.map(cls => (
          editingId === cls.id ? (
            <ClassForm
              key={cls.id}
              initial={cls}
              onSave={handleUpdate}
              onCancel={() => setEditingId(null)}
              gradeOptions={gradeOptions}
            />
          ) : (
            <div key={cls.id} className="rounded-lg hover:bg-slate-50 group">
              {confirmDeleteId === cls.id ? (
                <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-xs text-red-700">「{cls.displayName}」を削除しますか？</span>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2 py-1 rounded text-slate-600 hover:bg-slate-100">キャンセル</button>
                    <button onClick={() => handleDelete(cls.id)}
                      className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">削除</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2.5 px-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#1a34b0' }} />
                    <span className="font-medium text-slate-800">{cls.displayName}</span>
                    {cls.lessonClass ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                        授業: {cls.lessonClass}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">{cls.grade}年{cls.group}</span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(cls.id); setAdding(false); }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(cls.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ))}
        {adding && (
          <ClassForm onSave={handleAdd} onCancel={() => setAdding(false)} gradeOptions={gradeOptions} />
        )}
      </div>

      <LinkMatrix
        subjects={subjects}
        classes={classes}
        links={subjectClassLinks}
        timetable={timetable}
        periodsPerDay={periodsPerDay}
        onToggle={handleToggleLink}
        onOpenPicker={(subject, cls) => setPickerTarget({ subject, cls })}
      />

      {pickerTarget && (
        <TimetablePicker
          subject={pickerTarget.subject}
          cls={pickerTarget.cls}
          timetable={timetable}
          periodsPerDay={periodsPerDay}
          onSave={handleSavePicker}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
