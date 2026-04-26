import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StepNav from '../components/StepNav';
import { getSchoolYearHolidays } from '../utils/holidays';

const DAYS_JP = ['日', '月', '火', '水', '木', '金', '土'];

// 行事タイプ定義
export const EVENT_TYPES = {
  day_change:   { label: '曜日変更',  color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc', range: false },
  school_event: { label: '学校行事', color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd', range: false },
  exam:         { label: '定期考査', color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', range: true  },
  school_trip:  { label: '修学旅行', color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd', range: true  },
  long_vacation:{ label: '長期休業', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', range: true  },
  other:        { label: 'その他',   color: '#a16207', bg: '#fefce8', border: '#fde047', range: false },
};

const SCHOOL_EVENT_SUBTYPES = ['始業式', '終業式', '入学式', '卒業式', '遠足', '文化祭', '体育祭', '合唱祭', 'その他'];

// カレンダー表示色は「授業への影響」で決定
export const IMPACT_COLORS = {
  full_cut:        { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', label: '1日授業カット' },
  partial_cut:     { color: '#f97316', bg: '#ffedd5', border: '#fdba74', label: '部分授業カット' },
  day_sub:         { color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd', label: '曜日変更' },
  day_sub_partial: { color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd', label: '曜日変更＋部分指定' },
  grade_specific:  { color: '#0891b2', bg: '#cffafe', border: '#67e8f9', label: '学年別指定' },
  none:            { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', label: 'なし（通常）' },
};
const WEEKDAYS = ['月', '火', '水', '木', '金'];

const SCHEDULE_IMPACTS = [
  { value: 'full_cut',        label: '1日授業カット' },
  { value: 'partial_cut',     label: '部分授業カット' },
  { value: 'day_sub',         label: '曜日変更' },
  { value: 'day_sub_partial', label: '曜日変更＋部分指定' },
  { value: 'grade_specific',  label: '学年別指定' },
  { value: 'none',            label: 'なし（通常）' },
];

// 単日イベントかどうか
function isSingleDay(type) {
  return !EVENT_TYPES[type]?.range;
}

// 日付文字列の比較用
function dateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ---- EventForm モーダル ----
function EventForm({ initial, onSave, onClose }) {
  const { state } = useApp();
  const { periodsPerDay = 7, classes = [] } = state;
  const allPeriods = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

  // 登録済みクラスから学年一覧を取得
  const uniqueGrades = [...new Set(classes.map(c => String(c.grade)).filter(Boolean))].sort();

  const defaultType = initial?.type || 'school_event';
  const defaultSubType = initial?.subType || '始業式';
  const [type, setType] = useState(defaultType);
  const [name, setName] = useState(
    initial?.name || (defaultType === 'school_event' ? defaultSubType : EVENT_TYPES[defaultType]?.label)
  );
  const [date, setDate] = useState(initial?.date || '');
  const [dateStart, setDateStart] = useState(initial?.dateStart || initial?.date || '');
  const [dateEnd, setDateEnd] = useState(initial?.dateEnd || '');
  const [subType, setSubType] = useState(defaultSubType);

  // 授業への影響
  const [scheduleImpact, setScheduleImpact] = useState(initial?.scheduleImpact || 'full_cut');
  const [cutMode, setCutMode] = useState(initial?.cutMode || 'morning');
  const [cutPeriods, setCutPeriods] = useState(initial?.cutPeriods || []);
  const [subDay, setSubDay] = useState(initial?.subDay || '月');
  const [subPeriods, setSubPeriods] = useState(initial?.subPeriods || []);
  // 学年別指定: { [grade]: { mode, cutMode, cutPeriods } }
  const [gradeImpacts, setGradeImpacts] = useState(initial?.gradeImpacts || {});

  function updateGradeImpact(grade, patch) {
    setGradeImpacts(prev => ({
      ...prev,
      [grade]: { ...(prev[grade] || { mode: 'none' }), ...patch },
    }));
  }

  function togglePeriod(arr, setArr, p) {
    setArr(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  // タイプ変更時：名前がデフォルト値の場合のみ自動更新
  const defaultLabels = [
    ...Object.values(EVENT_TYPES).map(d => d.label),
    ...SCHOOL_EVENT_SUBTYPES.filter(s => s !== 'その他'),
  ];
  function handleTypeChange(t) {
    setType(t);
    if (!name || defaultLabels.includes(name)) {
      setName(t === 'school_event' ? subType : EVENT_TYPES[t].label);
    }
    if (t === 'day_change') setScheduleImpact('day_sub');
    else if (scheduleImpact === 'day_sub') setScheduleImpact('full_cut');
  }

  // 学校行事のsubType変更時、nameをsubTypeに合わせる（その他以外）
  function handleSubTypeChange(st) {
    setSubType(st);
    if (st !== 'その他') setName(st);
    else setName('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const single = isSingleDay(type);
    if (!name.trim()) return;
    if (single && !date) return;
    if (!single && (!dateStart || !dateEnd)) return;
    if (!single && dateStart > dateEnd) return;

    const event = {
      type,
      name: name.trim(),
      ...(single ? { date } : { dateStart, dateEnd }),
      ...(type === 'school_event' ? { subType } : {}),
      ...(type === 'day_change' ? { subDay } : {}),
      scheduleImpact,
      ...(scheduleImpact === 'partial_cut' ? { cutMode, ...(cutMode === 'custom' ? { cutPeriods: [...cutPeriods].sort((a,b)=>a-b) } : {}) } : {}),
      ...((scheduleImpact === 'day_sub' || scheduleImpact === 'day_sub_partial') ? { subDay } : {}),
      ...(scheduleImpact === 'day_sub_partial' ? { subPeriods: [...subPeriods].sort((a,b)=>a-b) } : {}),
      ...(scheduleImpact === 'grade_specific' ? { gradeImpacts } : {}),
    };
    onSave(event);
  }

  const single = isSingleDay(type);
  const def = EVENT_TYPES[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-lg">{initial ? '行事を編集' : '行事を追加'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 種別 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">種別</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EVENT_TYPES).map(([key, d]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                    type === key ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  style={type === key ? { backgroundColor: d.color } : {}}
                >
                  {d.label}
                  {d.range && <span className="ml-1 opacity-70 text-[10px]">（期間）</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 曜日変更の振替曜日 */}
          {type === 'day_change' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">振替曜日（この日は〇曜日の授業を行う）</label>
              <div className="flex gap-2">
                {WEEKDAYS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSubDay(d)}
                    className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      subDay === d ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    style={subDay === d ? { backgroundColor: def.color } : {}}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 学校行事のサブタイプ */}
          {type === 'school_event' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">行事の種類</label>
              <div className="flex flex-wrap gap-2">
                {SCHOOL_EVENT_SUBTYPES.map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSubTypeChange(st)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      subType === st ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    style={subType === st ? { backgroundColor: def.color } : {}}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 行事名 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {type === 'school_event' && subType === 'その他' ? '行事名（自由入力）' : '行事名'}
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={
                type === 'exam'          ? '例：1学期中間考査' :
                type === 'school_trip'   ? '修学旅行' :
                type === 'long_vacation' ? '例：夏季休業' : ''
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              readOnly={type === 'school_event' && subType !== 'その他'}
              style={type === 'school_event' && subType !== 'その他' ? { backgroundColor: '#f8fafc' } : {}}
            />
          </div>

          {/* 日付（単日） */}
          {single && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">日付</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          )}

          {/* 日付範囲（複数日） */}
          {!single && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">開始日</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={e => setDateStart(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">終了日</label>
                <input
                  type="date"
                  value={dateEnd}
                  min={dateStart}
                  onChange={e => setDateEnd(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              {dateStart && dateEnd && dateStart <= dateEnd && (
                <div className="col-span-2 text-xs text-slate-500">
                  {Math.ceil((new Date(dateEnd) - new Date(dateStart)) / 86400000) + 1} 日間
                </div>
              )}
              {dateStart && dateEnd && dateStart > dateEnd && (
                <p className="col-span-2 text-xs text-red-500">終了日は開始日以降を指定してください</p>
              )}
            </div>
          )}

          {/* 授業への影響 */}
          {type !== 'long_vacation' && type !== 'day_change' && (
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">授業への影響</label>
              <div className="flex flex-col gap-1.5">
                {SCHEDULE_IMPACTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScheduleImpact(opt.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      scheduleImpact === opt.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 部分授業カット の詳細 */}
              {scheduleImpact === 'partial_cut' && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    {[
                      { value: 'morning',   label: '午前カット' },
                      { value: 'afternoon', label: '午後カット' },
                      { value: 'custom',    label: '時限指定' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCutMode(opt.value)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          cutMode === opt.value ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        style={cutMode === opt.value ? { backgroundColor: '#0d9488' } : {}}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {cutMode === 'custom' && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5">カットする時限を選択</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allPeriods.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => togglePeriod(cutPeriods, setCutPeriods, p)}
                            className={`w-9 h-9 rounded-lg border text-xs font-medium transition-colors ${
                              cutPeriods.includes(p) ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            style={cutPeriods.includes(p) ? { backgroundColor: '#0d9488' } : {}}
                          >
                            {p}限
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 学年別指定 の詳細 */}
              {scheduleImpact === 'grade_specific' && (
                <div className="mt-3 space-y-3">
                  {uniqueGrades.length === 0 ? (
                    <p className="text-xs text-amber-600">クラスが登録されていません。ステップ1でクラスを登録してください。</p>
                  ) : (
                    uniqueGrades.map(grade => {
                      const gi = gradeImpacts[grade] || { mode: 'none' };
                      return (
                        <div key={grade} className="border border-slate-200 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-semibold text-slate-600">{grade}年生</p>
                          {/* 影響モード選択 */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { value: 'full_cut',    label: '全カット' },
                              { value: 'partial_cut', label: '部分カット' },
                              { value: 'none',        label: 'なし（通常）' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateGradeImpact(grade, { mode: opt.value })}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                                  gi.mode === opt.value ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                                style={gi.mode === opt.value ? { backgroundColor: '#0d9488' } : {}}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {/* 部分カットの詳細 */}
                          {gi.mode === 'partial_cut' && (
                            <div className="space-y-2">
                              <div className="flex gap-1.5 flex-wrap">
                                {[
                                  { value: 'morning',   label: '午前カット' },
                                  { value: 'afternoon', label: '午後カット' },
                                  { value: 'custom',    label: '時限指定' },
                                ].map(opt => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateGradeImpact(grade, { cutMode: opt.value })}
                                    className={`px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                                      gi.cutMode === opt.value ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                    style={gi.cutMode === opt.value ? { backgroundColor: '#0891b2' } : {}}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              {gi.cutMode === 'custom' && (
                                <div className="flex flex-wrap gap-1">
                                  {allPeriods.map(p => {
                                    const selected = (gi.cutPeriods || []).includes(p);
                                    return (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                          const cur = gi.cutPeriods || [];
                                          updateGradeImpact(grade, {
                                            cutPeriods: selected ? cur.filter(x => x !== p) : [...cur, p],
                                          });
                                        }}
                                        className={`w-9 h-9 rounded-lg border text-xs font-medium transition-colors ${
                                          selected ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        style={selected ? { backgroundColor: '#0891b2' } : {}}
                                      >
                                        {p}限
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 曜日変更 の詳細 */}
              {(scheduleImpact === 'day_sub' || scheduleImpact === 'day_sub_partial') && (
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">振替曜日（この日は〇曜日の授業を行う）</p>
                    <div className="flex gap-2">
                      {WEEKDAYS.map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSubDay(d)}
                          className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                            subDay === d ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                          style={subDay === d ? { backgroundColor: '#0d9488' } : {}}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  {scheduleImpact === 'day_sub_partial' && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1.5">振替する時限を選択（残りの時限はカット）</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allPeriods.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => togglePeriod(subPeriods, setSubPeriods, p)}
                            className={`w-9 h-9 rounded-lg border text-xs font-medium transition-colors ${
                              subPeriods.includes(p) ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            style={subPeriods.includes(p) ? { backgroundColor: '#0d9488' } : {}}
                          >
                            {p}限
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm rounded-lg text-white font-medium"
              style={{ backgroundColor: '#0d9488' }}
            >
              {initial ? '更新する' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 曜日変更イベントの表示ラベルを生成
function getEventDisplayLabel(event) {
  const isDaySub = event.type === 'day_change'
    || event.scheduleImpact === 'day_sub'
    || event.scheduleImpact === 'day_sub_partial';
  if (isDaySub && event.subDay) {
    const day = event.subDay;
    if (event.scheduleImpact === 'day_sub_partial' && event.subPeriods?.length > 0) {
      const sorted = [...event.subPeriods].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      return `${min}〜${max}限${day}曜授業`;
    }
    return `${day}曜授業`;
  }
  return event.name;
}

// ---- EventBadge ----
function EventBadge({ event, onClick }) {
  const impact = event.scheduleImpact || 'none';
  const col = IMPACT_COLORS[impact] || IMPACT_COLORS.none;
  const label = getEventDisplayLabel(event);

  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate leading-tight transition-opacity hover:opacity-80 mt-0.5"
      style={{ backgroundColor: col.bg, color: col.color, border: `1px solid ${col.border}` }}
      title={label}
    >
      {label}
    </button>
  );
}

const DOW_JP = ['日', '月', '火', '水', '木', '金', '土'];

// 指定曜日(1=月..5=金)に時間割で授業があるか
function timetableHasLesson(dow, timetable) {
  const jpDay = ['', '月', '火', '水', '木', '金'][dow];
  if (!jpDay) return false;
  return Object.values(timetable[jpDay] || {}).some(c => c?.type === 'lesson');
}

// ---- MonthCalendar（縦リスト形式） ----
function MonthCalendar({ year, month, events, holidays, timetable, onDayClick, onEventClick }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 月ヘッダー */}
      <div className="grid text-xs font-semibold py-1.5 px-3 border-b border-slate-100 bg-slate-50 text-slate-500"
        style={{ gridTemplateColumns: '3rem 1.5rem 1fr' }}>
        <span>日付</span>
        <span>曜</span>
        <span>行事・予定</span>
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const ds = dateStr(year, month, day);
          const dow = new Date(year, month, day).getDay();
          const isSat = dow === 6;
          const isSun = dow === 0;
          const isWeekend = isSat || isSun;
          const holidayName = holidays[ds];
          const isHoliday = !!holidayName;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

          // その日のイベントを取得
          const dayEvents = events.filter(ev => {
            if (ev.date) return ev.date === ds;
            if (ev.dateStart && ev.dateEnd) return ev.dateStart <= ds && ds <= ev.dateEnd;
            return false;
          });

          // 授業があるかどうか判定
          const hasFullCut = dayEvents.some(ev =>
            ev.type === 'long_vacation' || ev.scheduleImpact === 'full_cut'
          );
          const hasLesson = !isWeekend && !isHoliday && !hasFullCut && timetableHasLesson(dow, timetable);

          // compact = 授業なし日（縦幅を縮小）
          const compact = !hasLesson;

          // 行の背景色
          let rowBg = 'bg-white';
          if (isWeekend) rowBg = 'bg-slate-100';
          else if (isHoliday || hasFullCut) rowBg = 'bg-red-50/60';
          else if (!timetableHasLesson(dow, timetable)) rowBg = 'bg-slate-50';

          // 日付の文字色
          let dateColor = 'text-slate-700';
          if (isSun || isHoliday) dateColor = 'text-red-500';
          else if (isSat) dateColor = 'text-blue-500';
          else if (isWeekend) dateColor = 'text-slate-400';

          return (
            <div
              key={day}
              onClick={() => onDayClick(year, month, day)}
              className={`grid cursor-pointer transition-colors hover:brightness-95 ${rowBg} ${
                compact ? 'py-0.5' : 'py-1.5'
              }`}
              style={{ gridTemplateColumns: '3rem 1.5rem 1fr' }}
            >
              {/* 日付 */}
              <div className={`flex items-center justify-end pr-2 shrink-0 ${compact ? 'text-xs' : 'text-sm'}`}>
                <span
                  className={`font-bold w-6 h-6 flex items-center justify-center rounded-full ${dateColor}`}
                  style={isToday ? { backgroundColor: '#14b8a6', color: '#fff' } : {}}
                >
                  {day}
                </span>
              </div>

              {/* 曜日 */}
              <div className={`flex items-center text-xs font-medium ${
                isSun || isHoliday ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-slate-400'
              } ${compact ? '' : ''}`}>
                {DOW_JP[dow]}
              </div>

              {/* 祝日名 + 行事バッジ */}
              <div className={`flex flex-wrap items-center gap-0.5 min-w-0 pr-2 ${compact ? '' : ''}`}>
                {holidayName && (
                  <span className="text-red-400 text-[10px] whitespace-nowrap">{holidayName}</span>
                )}
                {dayEvents.map(ev => (
                  <EventBadge
                    key={ev.id}
                    event={ev}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- メインページ ----
export default function EventCalendar() {
  const { state, dispatch } = useApp();
  const { events = [], schoolYear, timetable = {} } = state;

  const startMonth = { year: schoolYear, month: 3 };
  const [viewYear, setViewYear] = useState(startMonth.year);
  const [viewMonth, setViewMonth] = useState(startMonth.month);
  const [forming, setForming] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const holidays = useMemo(() => getSchoolYearHolidays(schoolYear), [schoolYear]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(y, m, d) {
    const date = dateStr(y, m, d);
    setForming({ date });
    setEditingEvent(null);
  }

  function handleEventClick(event) {
    setEditingEvent(event);
    setForming(null);
  }

  function handleSaveNew(eventData) {
    dispatch({ type: 'ADD_EVENT', event: eventData });
    setForming(null);
  }

  function handleSaveEdit(eventData) {
    dispatch({ type: 'UPDATE_EVENT', id: editingEvent.id, data: eventData });
    setEditingEvent(null);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_EVENT', id });
    setConfirmDeleteId(null);
    setEditingEvent(null);
  }

  // 当月に関係するイベント（単日または期間が当月と重なる）
  const monthStart = dateStr(viewYear, viewMonth, 1);
  const monthEnd = dateStr(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate());
  const monthEvents = events
    .filter(ev => {
      if (ev.date) return ev.date >= monthStart && ev.date <= monthEnd;
      if (ev.dateStart && ev.dateEnd) return ev.dateStart <= monthEnd && ev.dateEnd >= monthStart;
      return false;
    })
    .sort((a, b) => (a.date || a.dateStart).localeCompare(b.date || b.dateStart));

  const monthName = `${viewYear}年${viewMonth + 1}月`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <StepNav />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 w-36 text-center">{monthName}</h2>
            <button onClick={nextMonth}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => { setForming({}); setEditingEvent(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: '#0d9488' }}
          >
            <Plus size={14} /> 行事を追加
          </button>
        </div>

        <div className="flex gap-4 flex-col lg:flex-row">
          {/* カレンダー */}
          <div className="flex-1 min-w-0">
            <MonthCalendar
              year={viewYear}
              month={viewMonth}
              events={events}
              holidays={holidays}
              timetable={timetable}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />

            {/* 凡例 */}
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border bg-red-50 border-red-200" />
                <span className="text-xs text-red-400">祝日</span>
              </div>
              {Object.entries(IMPACT_COLORS).map(([key, col]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border" style={{ backgroundColor: col.bg, borderColor: col.border }} />
                  <span className="text-xs text-slate-500">{col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 月の行事リスト */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{viewMonth + 1}月の行事</h3>
              {monthEvents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">行事なし</p>
              ) : (
                <div className="space-y-2">
                  {monthEvents.map(ev => {
                    const col = IMPACT_COLORS[ev.scheduleImpact || 'none'] || IMPACT_COLORS.none;
                    const typeDef = EVENT_TYPES[ev.type];
                    let dateLabel = '';
                    if (ev.date) {
                      const d = new Date(ev.date + 'T00:00:00');
                      dateLabel = `${d.getMonth() + 1}/${d.getDate()}(${DAYS_JP[d.getDay()]})`;
                    } else if (ev.dateStart && ev.dateEnd) {
                      const ds = new Date(ev.dateStart + 'T00:00:00');
                      const de = new Date(ev.dateEnd + 'T00:00:00');
                      dateLabel = `${ds.getMonth() + 1}/${ds.getDate()}〜${de.getMonth() + 1}/${de.getDate()}`;
                    }

                    return (
                      <div key={ev.id} className="rounded-lg border p-2.5"
                        style={{ borderColor: col.border, backgroundColor: col.bg }}>
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                                style={{ backgroundColor: col.color }}>
                                {typeDef?.label}
                              </span>
                            </div>
                            <div className="text-xs font-semibold truncate mt-0.5" style={{ color: col.color }}>
                              {ev.name}{ev.type === 'day_change' && ev.subDay ? `（${ev.subDay}曜）` : ''}
                            </div>
                            <div className="text-xs text-slate-500">{dateLabel}</div>
                            {ev.scheduleImpact && ev.scheduleImpact !== 'none' && (
                              <div className="text-[10px] mt-0.5" style={{ color: col.color }}>
                                {ev.scheduleImpact === 'full_cut' && '1日授業カット'}
                                {ev.scheduleImpact === 'partial_cut' && (
                                  ev.cutMode === 'morning' ? '午前カット' :
                                  ev.cutMode === 'afternoon' ? '午後カット' :
                                  `${ev.cutPeriods?.join('・')}限カット`
                                )}
                                {ev.scheduleImpact === 'day_sub' && `${ev.subDay}曜日課`}
                                {ev.scheduleImpact === 'day_sub_partial' && `${ev.subPeriods?.join('・')}限 ${ev.subDay}曜日課・残りカット`}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => handleEventClick(ev)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white/50">
                              <Pencil size={12} />
                            </button>
                            {confirmDeleteId === ev.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDelete(ev.id)}
                                  className="p-1 rounded bg-red-500 text-white"><Check size={12} /></button>
                                <button onClick={() => setConfirmDeleteId(null)}
                                  className="p-1 rounded text-slate-400 hover:bg-white/50"><X size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(ev.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-white/50">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {forming !== null && (
        <EventForm
          initial={forming.date ? { date: forming.date } : undefined}
          onSave={handleSaveNew}
          onClose={() => setForming(null)}
        />
      )}

      {editingEvent && (
        <EventForm
          initial={editingEvent}
          onSave={handleSaveEdit}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
