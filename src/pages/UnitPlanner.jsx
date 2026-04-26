import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Check, X, ChevronDown, ChevronRight,
  BookOpen, SkipForward, ArrowUp, ArrowDown, Milestone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StepNav from '../components/StepNav';
import { TEXTBOOK_TEMPLATES, TEMPLATE_SUBJECTS, getTemplatesBySubject } from '../data/textbookTemplates';
import { flattenUnitTree, TERM_COLORS } from '../utils/unitUtils';

// ---- ユーティリティ ----
function uid() {
  return `u${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function injectIds(units) {
  return units.map(l => ({
    ...l,
    id: uid(),
    children: (l.children || []).map(m => ({
      ...m,
      id: uid(),
      children: (m.children || []).map(s => ({ ...s, id: uid() })),
    })),
  }));
}

// ---- ツリー操作（純関数） ----
const T = {
  addLarge: (tree) => [...tree, { id: uid(), name: '新しい大単元', children: [] }],
  addMedium: (tree, lid) => tree.map(l => l.id !== lid ? l : { ...l, children: [...l.children, { id: uid(), name: '新しい中単元', children: [] }] }),
  addSmall: (tree, lid, mid) => tree.map(l => l.id !== lid ? l : {
    ...l, children: l.children.map(m => m.id !== mid ? m : { ...m, children: [...m.children, { id: uid(), name: '' }] }),
  }),
  addSmallAfterWithId: (tree, lid, mid, sid, newId) => tree.map(l => l.id !== lid ? l : {
    ...l, children: l.children.map(m => m.id !== mid ? m : {
      ...m, children: (() => {
        const i = m.children.findIndex(s => s.id === sid);
        const a = [...m.children];
        a.splice(i + 1, 0, { id: newId, name: '' });
        return a;
      })(),
    }),
  }),
  updateLarge: (tree, lid, name) => tree.map(l => l.id === lid ? { ...l, name } : l),
  updateMedium: (tree, lid, mid, name) => tree.map(l => l.id !== lid ? l : { ...l, children: l.children.map(m => m.id === mid ? { ...m, name } : m) }),
  updateSmall: (tree, lid, mid, sid, name) => tree.map(l => l.id !== lid ? l : {
    ...l, children: l.children.map(m => m.id !== mid ? m : { ...m, children: m.children.map(s => s.id === sid ? { ...s, name } : s) }),
  }),
  deleteLarge: (tree, lid) => tree.filter(l => l.id !== lid),
  deleteMedium: (tree, lid, mid) => tree.map(l => l.id !== lid ? l : { ...l, children: l.children.filter(m => m.id !== mid) }),
  deleteSmall: (tree, lid, mid, sid) => tree.map(l => l.id !== lid ? l : {
    ...l, children: l.children.map(m => m.id !== mid ? m : { ...m, children: m.children.filter(s => s.id !== sid) }),
  }),
  moveLarge: (tree, lid, d) => {
    const i = tree.findIndex(l => l.id === lid); if (i < 0) return tree;
    const j = i + d; if (j < 0 || j >= tree.length) return tree;
    const a = [...tree]; [a[i], a[j]] = [a[j], a[i]]; return a;
  },
  moveMedium: (tree, lid, mid, d) => tree.map(l => {
    if (l.id !== lid) return l;
    const i = l.children.findIndex(m => m.id === mid); if (i < 0) return l;
    const j = i + d; if (j < 0 || j >= l.children.length) return l;
    const a = [...l.children]; [a[i], a[j]] = [a[j], a[i]]; return { ...l, children: a };
  }),
  moveSmall: (tree, lid, mid, sid, d) => tree.map(l => l.id !== lid ? l : {
    ...l, children: l.children.map(m => {
      if (m.id !== mid) return m;
      const i = m.children.findIndex(s => s.id === sid); if (i < 0) return m;
      const j = i + d; if (j < 0 || j >= m.children.length) return m;
      const a = [...m.children]; [a[i], a[j]] = [a[j], a[i]]; return { ...m, children: a };
    }),
  }),
};

// ---- テンプレート選択モーダル ----
function TemplateModal({ onApply, onClose }) {
  const [subject, setSubject] = useState(TEMPLATE_SUBJECTS[0]);
  const templates = getTemplatesBySubject(subject);
  const [selectedId, setSelectedId] = useState(templates[0]?.id || '');
  const selected = TEXTBOOK_TEMPLATES.find(t => t.id === selectedId);

  function handleSubjectChange(s) {
    setSubject(s);
    const ts = getTemplatesBySubject(s);
    setSelectedId(ts[0]?.id || '');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            <BookOpen size={18} className="text-teal-500" /> 教科書テンプレートから読み込む
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="flex gap-4 p-6 flex-1 min-h-0">
          {/* 左：科目・出版社選択 */}
          <div className="w-48 shrink-0 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">科目</p>
              <div className="space-y-1">
                {TEMPLATE_SUBJECTS.map(s => (
                  <button key={s} onClick={() => handleSubjectChange(s)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      subject === s ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    style={subject === s ? { backgroundColor: '#0f1f6e' } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">出版社</p>
              <div className="space-y-1">
                {templates.map(t => (
                  <button key={t.id} onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedId === t.id ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    style={selectedId === t.id ? { backgroundColor: '#0d9488' } : {}}>
                    {t.publisher}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右：プレビュー */}
          <div className="flex-1 min-w-0 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
            <p className="text-xs font-medium text-slate-500 mb-2">単元構成プレビュー</p>
            {selected ? (
              <div className="space-y-2">
                {selected.units.map((l, li) => (
                  <div key={li}>
                    <div className="text-xs font-bold text-white px-2 py-1 rounded mb-1" style={{ backgroundColor: '#0f1f6e' }}>
                      {l.name}
                    </div>
                    {l.children.map((m, mi) => (
                      <div key={mi} className="ml-3 mb-1">
                        <div className="text-xs font-semibold text-teal-700 px-2 py-0.5 bg-teal-50 rounded mb-0.5">
                          {m.name}
                        </div>
                        {m.children.map((s, si) => (
                          <div key={si} className="ml-3 text-xs text-slate-500 py-0.5">• {s.name}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400">選択してください</p>}
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            キャンセル
          </button>
          <button
            onClick={() => selected && onApply(selected)}
            disabled={!selected}
            className="flex-1 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-40"
            style={{ backgroundColor: '#0d9488' }}>
            このテンプレートを適用
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- インライン編集可能テキスト ----
function EditableText({ value, onSave, className, placeholder, autoEdit }) {
  const [editing, setEditing] = useState(!!autoEdit);
  const [draft, setDraft] = useState(value);

  function commit() {
    if (draft.trim()) onSave(draft.trim());
    else setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`${className} bg-white text-slate-800 border border-teal-400 rounded px-1 outline-none focus:ring-2 focus:ring-teal-300`}
      />
    );
  }
  return (
    <span
      className={`${className} cursor-pointer hover:underline hover:decoration-dashed`}
      title="クリックして編集"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || <span className="opacity-40">{placeholder}</span>}
    </span>
  );
}

// ---- 削除確認ボタン ----
function DeleteButton({ onDelete }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <div className="flex gap-1">
      <button onClick={onDelete} className="p-1 rounded bg-red-500 text-white hover:bg-red-600"><Check size={11} /></button>
      <button onClick={() => setConfirm(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100"><X size={11} /></button>
    </div>
  );
  return (
    <button onClick={() => setConfirm(true)} className="p-1 rounded text-slate-300 hover:text-red-400 hover:bg-red-50">
      <Trash2 size={11} />
    </button>
  );
}

// ---- 上下移動ボタン ----
function MoveButtons({ onUp, onDown }) {
  return (
    <div className="flex flex-col">
      <button onClick={onUp} className="p-0.5 text-slate-300 hover:text-slate-500"><ArrowUp size={11} /></button>
      <button onClick={onDown} className="p-0.5 text-slate-300 hover:text-slate-500"><ArrowDown size={11} /></button>
    </div>
  );
}

// ---- 学期区切りバナー ----
function TermBanner({ termName, color }) {
  return (
    <div className="flex items-center gap-2 py-1 px-2">
      <div className="flex-1 h-px" style={{ backgroundColor: color }} />
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1"
        style={{ backgroundColor: color }}>
        <Milestone size={10} />
        {termName}末
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: color }} />
    </div>
  );
}

// ---- 単元ツリーエディタ ----
// boundaryMap: { [unitId]: { termName, color } }
function UnitTree({ tree, onChange, boundaryMap = {} }) {
  const [openLarge, setOpenLarge] = useState({});
  const [openMedium, setOpenMedium] = useState({});
  const [newUnitId, setNewUnitId] = useState(null);

  function toggleLarge(id) { setOpenLarge(p => ({ ...p, [id]: !p[id] })); }
  function toggleMedium(id) { setOpenMedium(p => ({ ...p, [id]: !p[id] })); }

  return (
    <div className="space-y-2">
      {tree.map((large, li) => (
        <div key={large.id} className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* 大単元ヘッダー */}
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: '#0f1f6e' }}>
            <button onClick={() => toggleLarge(large.id)} className="text-white/70 hover:text-white">
              {openLarge[large.id] !== false ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
            <span className="text-xs text-white/60 font-medium w-5 text-center">{li + 1}</span>
            <EditableText
              value={large.name}
              onSave={name => onChange(T.updateLarge(tree, large.id, name))}
              className="flex-1 text-sm font-bold text-white"
              placeholder="大単元名"
            />
            <MoveButtons
              onUp={() => onChange(T.moveLarge(tree, large.id, -1))}
              onDown={() => onChange(T.moveLarge(tree, large.id, 1))}
            />
            <DeleteButton onDelete={() => onChange(T.deleteLarge(tree, large.id))} />
          </div>

          {/* 大単元が葉（中単元なし）の場合の境界バナー */}
          {(!large.children?.length) && boundaryMap[large.id] && (
            <TermBanner termName={boundaryMap[large.id].termName} color={boundaryMap[large.id].color} />
          )}

          {/* 中単元リスト */}
          {openLarge[large.id] !== false && (
            <div className="bg-white">
              {large.children.map((medium, mi) => {
                // 中単元に子がない → 中単元自体が境界対象
                const mediumIsLeaf = !medium.children?.length;
                return (
                <div key={medium.id} className="border-t border-slate-100">
                  {/* 中単元ヘッダー */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-teal-50">
                    <button onClick={() => toggleMedium(medium.id)} className="text-teal-400 hover:text-teal-600">
                      {openMedium[medium.id] !== false ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    <span className="text-[11px] text-teal-400 font-medium w-5 text-center">{li + 1}-{mi + 1}</span>
                    <EditableText
                      value={medium.name}
                      onSave={name => onChange(T.updateMedium(tree, large.id, medium.id, name))}
                      className="flex-1 text-xs font-semibold text-teal-700"
                      placeholder="中単元名"
                    />
                    <MoveButtons
                      onUp={() => onChange(T.moveMedium(tree, large.id, medium.id, -1))}
                      onDown={() => onChange(T.moveMedium(tree, large.id, medium.id, 1))}
                    />
                    <DeleteButton onDelete={() => onChange(T.deleteMedium(tree, large.id, medium.id))} />
                  </div>
                  {/* 中単元が境界の場合のバナー */}
                  {mediumIsLeaf && boundaryMap[medium.id] && (
                    <TermBanner termName={boundaryMap[medium.id].termName} color={boundaryMap[medium.id].color} />
                  )}

                  {/* 小単元リスト */}
                  {openMedium[medium.id] !== false && (
                    <div className="pl-12 pr-3 py-1.5 space-y-1">
                      {medium.children.map((small, si) => (
                        <div key={small.id}>
                          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 group">
                            <span className="text-[10px] text-slate-400 w-8 text-right shrink-0">{li + 1}-{mi + 1}-{si + 1}</span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <EditableText
                              value={small.name}
                              onSave={name => { onChange(T.updateSmall(tree, large.id, medium.id, small.id, name)); setNewUnitId(null); }}
                              className="flex-1 text-xs text-slate-700"
                              placeholder="小単元名を入力"
                              autoEdit={newUnitId === small.id}
                            />
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const newId = uid();
                                  onChange(T.addSmallAfterWithId(tree, large.id, medium.id, small.id, newId));
                                  setNewUnitId(newId);
                                }}
                                title="下に小単元を追加"
                                className="p-0.5 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              >
                                <Plus size={11} />
                              </button>
                              <MoveButtons
                                onUp={() => onChange(T.moveSmall(tree, large.id, medium.id, small.id, -1))}
                                onDown={() => onChange(T.moveSmall(tree, large.id, medium.id, small.id, 1))}
                              />
                              <DeleteButton onDelete={() => onChange(T.deleteSmall(tree, large.id, medium.id, small.id))} />
                            </div>
                          </div>
                          {/* 小単元境界バナー */}
                          {boundaryMap[small.id] && (
                            <TermBanner termName={boundaryMap[small.id].termName} color={boundaryMap[small.id].color} />
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newId = uid();
                          const newTree = [...tree.map(l => l.id !== large.id ? l : {
                            ...l, children: l.children.map(m => m.id !== medium.id ? m : {
                              ...m, children: [...m.children, { id: newId, name: '' }],
                            }),
                          })];
                          onChange(newTree);
                          setNewUnitId(newId);
                        }}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-teal-600 px-2 py-1 rounded hover:bg-teal-50 transition-colors">
                        <Plus size={11} /> 小単元を追加
                      </button>
                    </div>
                  )}
                </div>
                );
              })}

              <div className="px-4 py-2 border-t border-slate-100">
                <button
                  onClick={() => { onChange(T.addMedium(tree, large.id)); setOpenLarge(p => ({ ...p, [large.id]: true })); }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 px-2 py-1 rounded hover:bg-teal-50 transition-colors">
                  <Plus size={12} /> 中単元を追加
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => onChange(T.addLarge(tree))}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50 transition-colors">
        <Plus size={14} /> 大単元を追加
      </button>
    </div>
  );
}

// ---- 学期区切り設定パネル ----
function TermBoundaryPanel({ subjectId, tree, terms, boundaries, onSet }) {
  const validTerms = (terms || []).filter(t => t.start && t.end);
  const flatItems = useMemo(() => flattenUnitTree(tree), [tree]);

  if (validTerms.length === 0) {
    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
        学期区切りを設定するには、まずステップ1で学期の開始・終了日を入力してください。
      </div>
    );
  }

  if (flatItems.length === 0) {
    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
        単元を登録すると、ここで学期区切りを設定できます。
      </div>
    );
  }

  return (
    <div className="mt-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <Milestone size={14} className="text-slate-400" />
        <h4 className="text-xs font-semibold text-slate-600">学期区切り設定</h4>
        <span className="text-[11px] text-slate-400">— 各学期末にどの単元まで進むかを設定</span>
      </div>
      <div className="divide-y divide-slate-100">
        {validTerms.map((term, idx) => {
          const color = TERM_COLORS[idx % TERM_COLORS.length];
          const currentUnitId = boundaries[term.id] ?? null;
          return (
            <div key={term.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                {term.name}末
              </span>
              <select
                value={currentUnitId || ''}
                onChange={e => onSet(term.id, e.target.value || null)}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">（設定なし）</option>
                {flatItems.map((item, i) => (
                  <option key={item.id} value={item.id}>
                    {i + 1}. {item.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- メインページ ----
export default function UnitPlanner() {
  const { state, dispatch } = useApp();
  const { subjects = [], unitTree = {}, noUnitSubjects = [], terms = [], termUnitBoundaries = {} } = state;
  const [activeSubjectId, setActiveSubjectId] = useState(subjects[0]?.id || null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const isNoUnit = activeSubjectId ? noUnitSubjects.includes(activeSubjectId) : false;
  const tree = (activeSubjectId ? unitTree[activeSubjectId] : null) || [];

  // 境界マップ: { [unitId]: { termName, color } }
  const boundaryMap = useMemo(() => {
    const map = {};
    if (!activeSubjectId) return map;
    const subBoundaries = termUnitBoundaries[activeSubjectId] || {};
    const validTerms = (terms || []).filter(t => t.start && t.end);
    validTerms.forEach((term, idx) => {
      const uid = subBoundaries[term.id];
      if (uid) map[uid] = { termName: term.name, color: TERM_COLORS[idx % TERM_COLORS.length] };
    });
    return map;
  }, [activeSubjectId, termUnitBoundaries, terms]);

  function handleChange(newTree) {
    if (!activeSubjectId) return;
    dispatch({ type: 'SET_UNIT_TREE', subjectId: activeSubjectId, tree: newTree });
  }

  function handleSetBoundary(termId, unitId) {
    dispatch({ type: 'SET_TERM_UNIT_BOUNDARY', subjectId: activeSubjectId, termId, unitId });
  }

  function handleApplyTemplate(template) {
    if (!activeSubjectId) return;
    dispatch({ type: 'SET_UNIT_TREE', subjectId: activeSubjectId, tree: injectIds(template.units) });
    setShowTemplateModal(false);
  }

  function handleToggleNoUnit() {
    if (!activeSubjectId) return;
    dispatch({ type: 'TOGGLE_NO_UNIT_SUBJECT', subjectId: activeSubjectId });
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
        <StepNav />
        <main className="max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="text-slate-500 text-sm">Step 1 の「科目・クラス」タブで科目を登録してください。</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <StepNav />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-800">単元設定</h2>
          <p className="text-xs text-slate-400 mt-0.5">科目ごとに大単元・中単元・小単元を設定します</p>
        </div>

        <div className="flex gap-4 flex-col lg:flex-row">
          {/* 左：科目リスト */}
          <div className="lg:w-48 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500">科目</p>
              </div>
              {subjects.map(s => {
                const isActive = s.id === activeSubjectId;
                const isSkip = noUnitSubjects.includes(s.id);
                const hasTree = (unitTree[s.id]?.length || 0) > 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSubjectId(s.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 text-sm transition-colors flex items-center gap-2 ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex-1 truncate">{s.name}</span>
                    {isSkip && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">スキップ</span>}
                    {!isSkip && hasTree && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右：単元エディタ */}
          <div className="flex-1 min-w-0">
            {activeSubject ? (
              <>
                {/* ヘッダー */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <h3 className="text-base font-bold text-slate-700 flex-1">{activeSubject.name}</h3>

                  {/* スキップトグル */}
                  <button
                    onClick={handleToggleNoUnit}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isNoUnit
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <SkipForward size={13} />
                    {isNoUnit ? '単元設定をスキップ中' : '単元なし（スキップ）'}
                  </button>

                  {/* テンプレート読み込み */}
                  {!isNoUnit && (
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      <BookOpen size={13} />
                      テンプレートから読み込む
                    </button>
                  )}
                </div>

                {isNoUnit ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <SkipForward size={24} className="text-amber-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-amber-700">この科目は単元設定をスキップします</p>
                    <p className="text-xs text-amber-500 mt-1">演習科目など、単元に沿わない授業に設定してください</p>
                    <button
                      onClick={handleToggleNoUnit}
                      className="mt-3 text-xs text-amber-600 underline hover:no-underline"
                    >
                      単元設定に戻す
                    </button>
                  </div>
                ) : (
                  <>
                    {tree.length === 0 && (
                      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center mb-4">
                        <BookOpen size={24} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">単元がまだ登録されていません</p>
                        <p className="text-xs text-slate-400 mt-1">
                          テンプレートから読み込むか、「大単元を追加」から手動で入力してください
                        </p>
                      </div>
                    )}
                    <UnitTree tree={tree} onChange={handleChange} boundaryMap={boundaryMap} />
                    <TermBoundaryPanel
                      subjectId={activeSubjectId}
                      tree={tree}
                      terms={terms}
                      boundaries={termUnitBoundaries[activeSubjectId] || {}}
                      onSet={handleSetBoundary}
                    />
                  </>
                )}
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
                左から科目を選択してください
              </div>
            )}
          </div>
        </div>
      </main>

      {showTemplateModal && (
        <TemplateModal
          onApply={handleApplyTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}
