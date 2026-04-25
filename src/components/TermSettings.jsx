import { useApp } from '../context/AppContext';
import { TERM_TEMPLATES } from '../context/AppContext';

const TERM_TYPE_OPTIONS = [
  { value: '3semester', label: '3学期制',        sub: '1学期・2学期・3学期' },
  { value: '2semester', label: '2学期制',        sub: '前期・後期' },
  { value: 'exam4',     label: '定期考査ごと（4回）', sub: '中間・期末 × 2学期' },
  { value: 'exam5',     label: '定期考査ごと（5回）', sub: '中間・期末 × 2学期＋学年末' },
];

export default function TermSettings() {
  const { state, dispatch } = useApp();
  const { termType = '3semester', terms } = state;

  function handleTypeChange(value) {
    dispatch({ type: 'SET_TERM_TYPE', termType: value });
  }

  function handleTermChange(id, field, value) {
    dispatch({
      type: 'SET_TERMS',
      terms: terms.map(t => (t.id === id ? { ...t, [field]: value } : t)),
    });
  }

  return (
    <div className="space-y-6">
      {/* 学期制の選択 */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-3">学期制の種別</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TERM_TYPE_OPTIONS.map(opt => {
            const isSelected = termType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleTypeChange(opt.value)}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`text-sm font-semibold ${isSelected ? 'text-teal-700' : 'text-slate-700'}`}>
                  {opt.label}
                </div>
                <div className={`text-xs mt-0.5 ${isSelected ? 'text-teal-500' : 'text-slate-400'}`}>
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
        {(termType === 'exam4' || termType === 'exam5') && (
          <p className="mt-2 text-xs text-slate-400">
            ※ 各期間は定期考査前後で区切って設定してください
          </p>
        )}
      </div>

      {/* 各学期の期間設定 */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-3">各期間の日程</h3>
        <div className="space-y-3">
          {terms.map((term, i) => (
            <div key={term.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: '#0f1f6e' }}
                >
                  {i + 1}
                </span>
                <span className="font-semibold text-slate-800 text-sm">{term.name}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">開始日</label>
                  <input
                    type="date"
                    value={term.start}
                    onChange={e => handleTermChange(term.id, 'start', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">終了日</label>
                  <input
                    type="date"
                    value={term.end}
                    onChange={e => handleTermChange(term.id, 'end', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>
              {term.start && term.end && (
                <p className="mt-2 text-xs text-slate-500">
                  {Math.max(0, Math.ceil((new Date(term.end) - new Date(term.start)) / (1000 * 60 * 60 * 24) + 1))} 日間
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
