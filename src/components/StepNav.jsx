import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, Upload, Undo2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const STEPS = [
  { step: 1, label: '年度設定', path: '/setup' },
  { step: 2, label: '行事カレンダー', path: '/calendar' },
  { step: 3, label: '単元配列', path: '/units' },
  { step: 4, label: '進度ビュー', path: '/progress' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

export default function StepNav() {
  const { state, dispatch, undo, canUndo } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);
  const currentStep = STEPS.find(s => s.path === location.pathname)?.step ?? 1;

  function handleYearChange(year) {
    dispatch({ type: 'SET_YEAR', year: Number(year) });
  }

  function handleExport() {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-planner-${state.schoolYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.schoolYear && data.terms) {
          dispatch({ type: 'IMPORT_STATE', data });
        }
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <>
      {/* header */}
      <header style={{ backgroundColor: '#0f1f6e' }} className="text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: '#14b8a6' }}>
              授
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">授業計画管理</h1>
              <p className="text-xs opacity-60">高校教員向け授業管理ツール</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
              <span className="text-xs opacity-75">年度</span>
              <select
                value={state.schoolYear}
                onChange={e => handleYearChange(e.target.value)}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
              >
                {YEARS.map(y => <option key={y} value={y} style={{ color: '#1e293b' }}>{y}年度</option>)}
              </select>
            </div>
            <button
              onClick={undo}
              disabled={!canUndo}
              title="操作を戻す (Ctrl+Z)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <Undo2 size={13} /> 元に戻す
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors">
              <Download size={13} /> エクスポート
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
              <Upload size={13} /> インポート
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>
      </header>

      {/* step bar */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center overflow-x-auto">
            {STEPS.map((s, i) => {
              const isActive = s.step === currentStep;
              const isDone = s.step < currentStep;
              return (
                <button
                  key={s.step}
                  onClick={() => navigate(s.path)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-teal-500 text-teal-600 font-semibold'
                      : isDone
                      ? 'border-transparent text-slate-500 hover:text-slate-700'
                      : 'border-transparent text-slate-400 hover:text-slate-500'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                    isActive ? 'text-white' : isDone ? 'text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                    style={isActive ? { backgroundColor: '#14b8a6' } : isDone ? { backgroundColor: '#94a3b8' } : {}}>
                    {s.step}
                  </span>
                  {s.label}
                  {i < STEPS.length - 1 && <span className="ml-2 text-slate-300">›</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
