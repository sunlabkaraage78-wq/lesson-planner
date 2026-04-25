import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

function SubjectRow({ subject, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
        <span className="font-medium text-slate-800 truncate">{subject.name}</span>
        {subject.code && (
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{subject.code}</span>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(subject)}
          className="p-1.5 rounded-md text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors"
          style={{ '--tw-bg-opacity': 1 }}>
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(subject.id)}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function SubjectForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [code, setCode] = useState(initial?.code || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), code: code.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2 px-3 bg-navy-50 rounded-lg border border-navy-200"
      style={{ backgroundColor: '#f0f4ff', borderColor: '#c0d2ff' }}>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="科目名（例：化学基礎）"
        className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="コード（任意）"
        className="w-28 border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
      <button type="submit" className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 transition-colors">
        <Check size={16} />
      </button>
      <button type="button" onClick={onCancel} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors">
        <X size={16} />
      </button>
    </form>
  );
}

export default function SubjectManager() {
  const { state, dispatch } = useApp();
  const { subjects } = state;
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function handleAdd({ name, code }) {
    dispatch({ type: 'ADD_SUBJECT', name, code });
    setAdding(false);
  }

  function handleUpdate({ name, code }) {
    dispatch({ type: 'UPDATE_SUBJECT', id: editingId, data: { name, code } });
    setEditingId(null);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_SUBJECT', id });
    setConfirmDeleteId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-700">科目一覧</h3>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors"
          style={{ backgroundColor: '#0d9488' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f766e'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d9488'}
        >
          <Plus size={14} />
          科目を追加
        </button>
      </div>

      <div className="space-y-1 min-h-[60px]">
        {subjects.length === 0 && !adding && (
          <p className="text-sm text-slate-400 text-center py-6">科目が登録されていません</p>
        )}
        {subjects.map(subject => (
          editingId === subject.id ? (
            <SubjectForm
              key={subject.id}
              initial={subject}
              onSave={handleUpdate}
              onCancel={() => setEditingId(null)}
            />
          ) : confirmDeleteId === subject.id ? (
            <div key={subject.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-xs text-red-700">「{subject.name}」を削除しますか？</span>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteId(null)}
                  className="text-xs px-2 py-1 rounded text-slate-600 hover:bg-slate-100">キャンセル</button>
                <button onClick={() => handleDelete(subject.id)}
                  className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">削除</button>
              </div>
            </div>
          ) : (
            <SubjectRow
              key={subject.id}
              subject={subject}
              onEdit={s => { setEditingId(s.id); setAdding(false); }}
              onDelete={id => setConfirmDeleteId(id)}
            />
          )
        ))}
        {adding && (
          <SubjectForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        )}
      </div>
    </div>
  );
}
