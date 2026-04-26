import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateLessonDates } from '../utils/lessonDates';
import { getSchoolYearHolidays } from '../utils/holidays';
import { flattenUnitTree, TERM_COLORS } from '../utils/unitUtils';

const WEEK_JP = ['日', '月', '火', '水', '木', '金', '土'];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatMonth(dateStr) { return String(parseInt(dateStr.slice(5, 7), 10)); }
function formatDay(dateStr)   { return String(parseInt(dateStr.slice(8, 10), 10)); }
function formatWeek(dateStr)  { return WEEK_JP[new Date(dateStr).getDay()]; }

function generateAllDates(schoolYear) {
  const dates = [];
  const d = new Date(schoolYear, 3, 1);
  const end = new Date(schoolYear + 1, 2, 31);
  while (d <= end) { dates.push(toDateStr(d)); d.setDate(d.getDate() + 1); }
  return dates;
}

// --- 自動入力モーダル ---
function AutoFillModal({ unitItems, linkedClasses, classDateSets, allYearDates, progressRecords, subjectId, onApply, onClose }) {
  const [mode, setMode] = useState('empty'); // 'empty' | 'overwrite'
  const [selectedClassIds, setSelectedClassIds] = useState(linkedClasses.map(c => c.id));

  function toggleClass(id) {
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // プレビュー：先頭5件を表示
  const preview = useMemo(() => {
    const cls = linkedClasses[0];
    if (!cls) return [];
    const lessonDates = allYearDates.filter(d => classDateSets[cls.id]?.has(d));
    const key = `${subjectId}_${cls.id}`;
    let unitIdx = 0;
    const rows = [];
    for (const date of lessonDates) {
      if (unitIdx >= unitItems.length) break;
      const existing = progressRecords[key]?.[date]?.content || '';
      if (mode === 'empty' && existing) { rows.push({ date, content: existing, skipped: true }); continue; }
      rows.push({ date, content: unitItems[unitIdx]?.label, skipped: false });
      unitIdx++;
      if (rows.length >= 6) break;
    }
    return rows;
  }, [mode, linkedClasses, classDateSets, allYearDates, progressRecords, subjectId, unitItems]);

  function handleApply() {
    const records = {};
    for (const cls of linkedClasses) {
      if (!selectedClassIds.includes(cls.id)) continue;
      const key = `${subjectId}_${cls.id}`;
      const lessonDates = allYearDates.filter(d => classDateSets[cls.id]?.has(d));
      let unitIdx = 0;
      for (const date of lessonDates) {
        if (unitIdx >= unitItems.length) break;
        const existingRecord = progressRecords[key]?.[date] || {};
        // ずらし済みのコマはスキップ（単元を割り当てない）
        if (existingRecord.shifted) continue;
        const existing = existingRecord.content || '';
        if (mode === 'empty' && existing) continue;
        if (!records[cls.id]) records[cls.id] = {};
        records[cls.id][date] = { content: unitItems[unitIdx].label, note: existingRecord.note || '', shifted: false };
        unitIdx++;
      }
    }
    onApply(records);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">単元から自動入力</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="text-xs text-gray-500">
          小単元を上から順に、授業日へ割り当てます。単元数が授業回数より少ない場合、残りは変更しません。
        </div>

        {unitItems.length === 0 ? (
          <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
            単元が設定されていません。③単元配列で単元を登録してください。
          </div>
        ) : (
          <>
            {/* 上書きモード */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">入力対象</label>
              <div className="flex gap-2">
                {[{ value: 'empty', label: '空欄のみ' }, { value: 'overwrite', label: 'すべて上書き' }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      mode === opt.value ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    style={mode === opt.value ? { backgroundColor: '#0d9488' } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* クラス選択 */}
            {linkedClasses.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">対象クラス</label>
                <div className="flex flex-wrap gap-2">
                  {linkedClasses.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => toggleClass(cls.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        selectedClassIds.includes(cls.id) ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={selectedClassIds.includes(cls.id) ? { backgroundColor: '#0d9488' } : {}}
                    >
                      {cls.displayName || `${cls.grade}年${cls.group}組`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* プレビュー（1クラス目の先頭6行） */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                プレビュー（{linkedClasses[0]?.displayName}・先頭6件）
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                {preview.map((row, i) => (
                  <div key={i} className={`flex gap-2 px-3 py-1.5 border-b border-gray-100 last:border-0 ${row.skipped ? 'text-gray-400 bg-gray-50' : 'text-gray-700'}`}>
                    <span className="shrink-0 w-12 text-gray-400">{formatMonth(row.date)}/{formatDay(row.date)}</span>
                    <span className="flex-1 truncate">{row.content || '―'}</span>
                    {row.skipped && <span className="text-gray-400 shrink-0">（スキップ）</span>}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1">単元数: {unitItems.length}件</div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                キャンセル
              </button>
              <button
                onClick={handleApply}
                disabled={selectedClassIds.length === 0}
                className="flex-1 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-40"
                style={{ backgroundColor: '#0d9488' }}
              >
                入力する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SHIFT_PRESETS = ['自習', '問題演習', '補講', 'テスト返却', 'その他'];

// --- インライン編集セル ---
function ContentCell({ value, note, shifted, onSave, onAdvance }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [draftNote, setDraftNote] = useState(note || '');
  const [draftShifted, setDraftShifted] = useState(!!shifted);
  const contentRef = useRef(null);

  useEffect(() => {
    if (editing && contentRef.current) contentRef.current.focus();
  }, [editing]);

  function open() {
    setDraft(value || '');
    setDraftNote(note || '');
    setDraftShifted(!!shifted);
    setEditing(true);
  }
  function save() {
    onSave({ content: draft, note: draftNote, shifted: draftShifted });
    setEditing(false);
  }

  if (!editing) {
    return (
      <div
        onClick={open}
        className={`min-h-[2rem] cursor-pointer px-1 py-0.5 rounded text-sm ${
          shifted ? 'border-2 border-red-400 bg-red-50' : 'hover:bg-blue-50'
        }`}
        title={shifted ? 'ずらし済み（クリックして編集）' : 'クリックして編集'}
      >
        {value
          ? <span className={shifted ? 'text-red-700' : ''}>{value}</span>
          : <span className={shifted ? 'text-red-300' : 'text-gray-300'} style={{ userSelect: 'none' }}>
              {shifted ? '（ずらし）' : '―'}
            </span>
        }
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-1" onKeyDown={e => e.key === 'Escape' && setEditing(false)}>
      <input
        ref={contentRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        className="border border-blue-400 rounded px-1 py-0.5 text-sm w-full"
        placeholder="授業内容"
      />
      {/* ずらしプリセット */}
      <div className="flex flex-wrap gap-1">
        {SHIFT_PRESETS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => { setDraft(p); setDraftShifted(true); }}
            className="text-[10px] px-1.5 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50"
          >
            {p}
          </button>
        ))}
      </div>
      <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)} rows={2}
        className="border border-gray-300 rounded px-1 py-0.5 text-xs w-full resize-none" placeholder="備考（任意）" />
      {/* ずらしトグル */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draftShifted}
          onChange={e => setDraftShifted(e.target.checked)}
          className="accent-red-500"
        />
        <span className="text-xs text-red-600">このコマをずらす（以降の内容を1コマ後ろへ）</span>
      </label>
      {/* 前倒しボタン */}
      {onAdvance && (
        <button
          type="button"
          onClick={() => { setEditing(false); onAdvance(); }}
          className="text-xs px-2 py-1 rounded border border-emerald-400 text-emerald-700 hover:bg-emerald-50 text-left"
        >
          ↑ 以降を1コマ前倒し（進度が早いとき）
        </button>
      )}
      <div className="flex gap-1 justify-end">
        <button onClick={() => setEditing(false)} className="text-xs px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100">キャンセル</button>
        <button onClick={save} className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600">保存</button>
      </div>
    </div>
  );
}

// --- メイン ---
export default function ProgressView() {
  const { state, dispatch } = useApp();
  const { subjects, classes, subjectClassLinks, timetable, events, schoolYear, terms, periodsPerDay, unitTree = {}, termUnitBoundaries = {} } = state;
  const progressRecords = state.progressRecords || {};

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTermIdx, setSelectedTermIdx] = useState(0);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [mobileClassId, setMobileClassId] = useState(null);

  const validTerms = useMemo(() => (terms || []).filter(t => t.start && t.end), [terms]);
  const activeSubjectId = selectedSubjectId ?? subjects[0]?.id ?? null;

  // 科目切替時にモバイルクラス選択をリセット
  useEffect(() => { setMobileClassId(null); }, [activeSubjectId]);
  const holidays = useMemo(() => getSchoolYearHolidays(schoolYear), [schoolYear]);

  const linkedClasses = useMemo(() => {
    if (!activeSubjectId) return [];
    const linkedIds = new Set(subjectClassLinks.filter(l => l.subjectId === activeSubjectId).map(l => l.classId));
    return classes.filter(c => linkedIds.has(c.id));
  }, [activeSubjectId, subjectClassLinks, classes]);

  const activeMobileClassId = mobileClassId ?? linkedClasses[0]?.id ?? null;

  const classDateSets = useMemo(() => {
    if (!activeSubjectId) return {};
    const result = {};
    for (const cls of linkedClasses) {
      const dates = generateLessonDates({
        subjectId: activeSubjectId, classId: cls.id, schoolYear,
        timetable, events, holidays, terms, periodsPerDay, classes,
      });
      result[cls.id] = new Set(dates);
    }
    return result;
  }, [activeSubjectId, linkedClasses, schoolYear, timetable, events, holidays, terms, periodsPerDay]);

  const allYearDates = useMemo(() => generateAllDates(schoolYear), [schoolYear]);

  const filteredAllDates = useMemo(() => {
    if (selectedTermIdx === -1 || validTerms.length === 0) return allYearDates;
    const term = validTerms[selectedTermIdx];
    if (!term) return allYearDates;
    return allYearDates.filter(d => d >= term.start && d <= term.end);
  }, [allYearDates, validTerms, selectedTermIdx]);

  const classCounters = useMemo(() => {
    const counters = {};
    for (const cls of linkedClasses) {
      counters[cls.id] = {};
      let n = 0;
      for (const d of allYearDates) {
        if (classDateSets[cls.id]?.has(d)) { n++; counters[cls.id][d] = n; }
      }
    }
    return counters;
  }, [linkedClasses, allYearDates, classDateSets]);

  // 現在の科目の単元を平坦化
  const unitItems = useMemo(() => flattenUnitTree(unitTree[activeSubjectId]), [unitTree, activeSubjectId]);

  // 学期区切り: { lessonIndex（0-based）: { termName, color } }
  // lessonIndex = 境界単元の flatIndex（その授業回の後に区切りを表示）
  const lessonBoundaries = useMemo(() => {
    const map = {};
    const subBoundaries = termUnitBoundaries[activeSubjectId] || {};
    const validTerms = (terms || []).filter(t => t.start && t.end);
    validTerms.forEach((term, idx) => {
      const uid = subBoundaries[term.id];
      if (!uid) return;
      const flatIdx = unitItems.findIndex(u => u.id === uid);
      if (flatIdx >= 0) map[flatIdx] = { termName: term.name, color: TERM_COLORS[idx % TERM_COLORS.length] };
    });
    return map;
  }, [termUnitBoundaries, activeSubjectId, terms, unitItems]);

  function getRecord(classId, date) {
    const key = `${activeSubjectId}_${classId}`;
    return progressRecords[key]?.[date] || { content: '', note: '' };
  }
  function handleSave(classId, date, record) {
    const key = `${activeSubjectId}_${classId}`;
    const oldRecord = progressRecords[key]?.[date] || {};

    // 新たにずらしフラグを立て、かつ既存コンテンツがある場合 → 連鎖して後続コマへ押し出す
    const changes = [{ date, record }];
    if (record.shifted && !oldRecord.shifted && oldRecord.content) {
      const lessonDates = allYearDates.filter(d => classDateSets[classId]?.has(d));
      const dateIdx = lessonDates.indexOf(date);
      let displaced = { content: oldRecord.content, note: oldRecord.note || '' };
      for (let i = dateIdx + 1; i < lessonDates.length && displaced; i++) {
        const nextDate = lessonDates[i];
        const nextRec = progressRecords[key]?.[nextDate] || {};
        if (nextRec.shifted) continue; // ずらし済みコマはスキップ
        const saved = displaced;
        displaced = nextRec.content ? { content: nextRec.content, note: nextRec.note || '' } : null;
        changes.push({ date: nextDate, record: { content: saved.content, note: saved.note, shifted: false } });
      }
    }

    for (const c of changes) {
      dispatch({ type: 'SET_PROGRESS_RECORD', subjectId: activeSubjectId, classId, date: c.date, record: c.record });
    }
  }

  function handleAdvance(classId, date) {
    const key = `${activeSubjectId}_${classId}`;
    const lessonDates = allYearDates.filter(d => classDateSets[classId]?.has(d));
    const dateIdx = lessonDates.indexOf(date);
    // 現在のコマから、1コマ下の内容を順番に引き上げる
    const changes = [];
    for (let i = dateIdx; i < lessonDates.length; i++) {
      const curDate = lessonDates[i];
      const curRec = progressRecords[key]?.[curDate] || {};
      if (i > dateIdx && curRec.shifted) continue;
      // 次の非ずらしコマの内容を取得
      let nextContent = '';
      let nextNote = '';
      for (let j = i + 1; j < lessonDates.length; j++) {
        const nextDate = lessonDates[j];
        const nextRec = progressRecords[key]?.[nextDate] || {};
        if (!nextRec.shifted) { nextContent = nextRec.content || ''; nextNote = nextRec.note || ''; break; }
      }
      changes.push({ date: curDate, record: { content: nextContent, note: nextNote, shifted: false } });
      // 空になったら終了
      if (!nextContent) break;
    }
    for (const c of changes) {
      dispatch({ type: 'SET_PROGRESS_RECORD', subjectId: activeSubjectId, classId, date: c.date, record: c.record });
    }
  }

  function handleAutoFillApply(records) {
    for (const [classId, dateMap] of Object.entries(records)) {
      for (const [date, record] of Object.entries(dateMap)) {
        dispatch({ type: 'SET_PROGRESS_RECORD', subjectId: activeSubjectId, classId, date, record });
      }
    }
    setShowAutoFill(false);
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        科目が登録されていません。まずステップ1で科目を設定してください。
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">④ 進度ビュー</h1>
        <nav className="flex gap-2 text-sm">
          <a href="/setup" className="text-blue-500 hover:underline">① 年度設定</a>
          <a href="/calendar" className="text-blue-500 hover:underline">② 行事カレンダー</a>
          <a href="/units" className="text-blue-500 hover:underline">③ 単元配列</a>
        </nav>
      </header>

      {/* 科目タブ */}
      <div className="bg-white border-b px-4 flex items-center justify-between overflow-x-auto">
        <div className="flex gap-0">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelectedSubjectId(s.id); setSelectedTermIdx(0); setShowAutoFill(false); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSubjectId === s.id ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        {/* 自動入力ボタン */}
        {linkedClasses.length > 0 && (
          <button
            onClick={() => setShowAutoFill(true)}
            className="shrink-0 ml-4 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors"
            style={{ borderColor: '#0d9488', color: '#0d9488' }}
          >
            📋 単元から自動入力
          </button>
        )}
      </div>

      {/* 学期タブ */}
      {validTerms.length > 0 && (
        <div className="bg-gray-100 border-b px-4 flex gap-1 py-1 overflow-x-auto">
          <button onClick={() => setSelectedTermIdx(-1)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedTermIdx === -1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'}`}>
            全期間
          </button>
          {validTerms.map((term, idx) => (
            <button key={term.id} onClick={() => setSelectedTermIdx(idx)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedTermIdx === idx ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'}`}>
              {term.name}
            </button>
          ))}
        </div>
      )}

      {/* テーブル */}
      <div className="flex-1 overflow-auto">
        {linkedClasses.length === 0 ? (
          <div className="text-gray-400 text-sm p-4">この科目に紐づくクラスがありません。</div>
        ) : (
          <>
          {/* ===== モバイル: カードリスト ===== */}
          <div className="sm:hidden">
            {/* クラス選択タブ（複数クラスの場合のみ） */}
            {linkedClasses.length > 1 && (
              <div className="bg-white border-b px-4 py-2 flex gap-1 overflow-x-auto">
                {linkedClasses.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setMobileClassId(cls.id)}
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap border transition-colors ${
                      activeMobileClassId === cls.id
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cls.displayName || `${cls.grade}年${cls.group}組`}
                  </button>
                ))}
              </div>
            )}
            {/* 授業日カード一覧 */}
            <div className="p-3 space-y-1">
              {activeMobileClassId && filteredAllDates
                .filter(dateStr => classDateSets[activeMobileClassId]?.has(dateStr))
                .map(dateStr => {
                  const lessonNum = classCounters[activeMobileClassId]?.[dateStr];
                  const record = getRecord(activeMobileClassId, dateStr);
                  const dow = new Date(dateStr).getDay();
                  const isSun = dow === 0, isSat = dow === 6;
                  const isHoliday = !!holidays[dateStr];
                  const dateTextColor = isSun || isHoliday ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700';
                  return (
                    <div key={dateStr} className={`bg-white rounded-lg border p-2 ${record.shifted ? 'border-red-300' : 'border-gray-200'}`}>
                      <div className="flex gap-2 items-start">
                        <div className={`shrink-0 w-12 text-xs text-center ${dateTextColor}`}>
                          <div className="font-medium">{formatMonth(dateStr)}/{formatDay(dateStr)}</div>
                          <div className="opacity-60">{formatWeek(dateStr)}曜</div>
                        </div>
                        <div className="shrink-0 text-xs text-gray-400 w-5 text-center pt-0.5">{lessonNum}</div>
                        <div className="flex-1 min-w-0">
                          <ContentCell
                            value={record.content}
                            note={record.note}
                            shifted={record.shifted}
                            onSave={rec => handleSave(activeMobileClassId, dateStr, rec)}
                            onAdvance={() => handleAdvance(activeMobileClassId, dateStr)}
                          />
                          {record.note && record.note.trim() && (
                            <div className="text-xs text-amber-700 bg-amber-100 rounded px-1 py-0.5 mt-0.5 whitespace-pre-wrap">{record.note}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* ===== デスクトップ: テーブル ===== */}
          <div className="hidden sm:block p-4">
          <div className="overflow-x-auto">
            <table className="border-collapse text-sm bg-white shadow-sm rounded-lg overflow-hidden w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 text-gray-600 text-xs">
                  <th className="border border-gray-200 px-2 py-2 whitespace-nowrap">月</th>
                  <th className="border border-gray-200 px-2 py-2 whitespace-nowrap">日</th>
                  <th className="border border-gray-200 px-2 py-2 whitespace-nowrap">曜</th>
                  {linkedClasses.map(cls => (
                    <th key={cls.id} className="border border-gray-200 px-3 py-2 whitespace-nowrap text-center min-w-[200px]">
                      {cls.displayName || `${cls.grade}年${cls.group}組`}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="border border-gray-200" colSpan={3} />
                  {linkedClasses.map(cls => (
                    <th key={cls.id} className="border border-gray-200 px-2 py-1">
                      <div className="flex gap-2">
                        <span className="flex-none w-6">回</span>
                        <span className="flex-1 text-center">授業内容</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // 最初のリンククラスの授業カウンタで境界を判定する
                  const refClassId = linkedClasses[0]?.id;
                  // 既に描画済みの境界インデックス
                  const shownBoundaries = new Set();
                  const rows = [];

                  for (const dateStr of filteredAllDates) {
                    const dow = new Date(dateStr).getDay();
                    const isSat = dow === 6, isSun = dow === 0, isWeekend = isSat || isSun;
                    const isHoliday = !!holidays[dateStr];
                    const anyLesson = linkedClasses.some(cls => classDateSets[cls.id]?.has(dateStr));
                    const hasNote = anyLesson && linkedClasses.some(cls => {
                      const r = getRecord(cls.id, dateStr);
                      return r.note && r.note.trim();
                    });

                    // 授業日かつ基準クラスに授業がある場合、境界チェック
                    if (anyLesson && refClassId && classDateSets[refClassId]?.has(dateStr)) {
                      const lessonNum = classCounters[refClassId]?.[dateStr]; // 1-based
                      if (lessonNum !== undefined) {
                        const boundaryIdx = lessonNum - 1; // 0-based
                        if (lessonBoundaries[boundaryIdx] && !shownBoundaries.has(boundaryIdx)) {
                          shownBoundaries.add(boundaryIdx);
                          const { termName, color } = lessonBoundaries[boundaryIdx];
                          rows.push(
                            <tr key={`boundary_${boundaryIdx}`}>
                              <td colSpan={3 + linkedClasses.length} className="p-0">
                                <div className="flex items-center gap-2 px-3 py-1"
                                  style={{ backgroundColor: color + '18' }}>
                                  <div className="flex-1 h-px" style={{ backgroundColor: color }} />
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: color }}>
                                    {termName}末
                                  </span>
                                  <div className="flex-1 h-px" style={{ backgroundColor: color }} />
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      }
                    }

                    let rowClass = '';
                    if (hasNote) rowClass = 'bg-amber-50';
                    else if (isWeekend) rowClass = 'bg-gray-100';
                    else if (isHoliday) rowClass = 'bg-red-50';
                    else if (!anyLesson) rowClass = 'bg-gray-50';

                    const compact = !anyLesson;
                    const dateTextColor = isSun || isHoliday ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700';
                    const dowTextColor  = isSun || isHoliday ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-gray-400';

                    rows.push(
                      <tr key={dateStr} className={rowClass}>
                        <td className={`border border-gray-200 text-center whitespace-nowrap ${dateTextColor} ${compact ? 'text-xs px-2 py-px' : 'px-2 py-1'}`}>
                          {formatMonth(dateStr)}
                        </td>
                        <td className={`border border-gray-200 text-center whitespace-nowrap font-medium ${dateTextColor} ${compact ? 'text-xs px-2 py-px' : 'px-2 py-1'}`}>
                          {formatDay(dateStr)}
                        </td>
                        <td className={`border border-gray-200 text-center whitespace-nowrap ${dowTextColor} ${compact ? 'text-xs px-2 py-px' : 'px-2 py-1'}`}>
                          {formatWeek(dateStr)}
                        </td>
                        {linkedClasses.map(cls => {
                          const hasLesson = classDateSets[cls.id]?.has(dateStr);
                          const lessonNum = classCounters[cls.id]?.[dateStr];
                          const record = getRecord(cls.id, dateStr);
                          if (!hasLesson) {
                            return <td key={cls.id} className={`border border-gray-200 ${isWeekend ? 'bg-gray-100' : isHoliday ? 'bg-red-50' : 'bg-gray-50'}`} />;
                          }
                          return (
                            <td key={cls.id} className="border border-gray-200 px-1 py-0.5 align-top">
                              <div className="flex gap-1 items-start">
                                <span className="flex-none w-6 text-center text-xs text-gray-400 pt-1">{lessonNum}</span>
                                <div className="flex-1 min-w-0">
                                  <ContentCell value={record.content} note={record.note} shifted={record.shifted} onSave={rec => handleSave(cls.id, dateStr, rec)} onAdvance={() => handleAdvance(cls.id, dateStr)} />
                                  {record.note && record.note.trim() && (
                                    <div className="text-xs text-amber-700 bg-amber-100 rounded px-1 py-0.5 mt-0.5 whitespace-pre-wrap">{record.note}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
          </div>
          </>
        )}
      </div>

      {showAutoFill && (
        <AutoFillModal
          unitItems={unitItems}
          linkedClasses={linkedClasses}
          classDateSets={classDateSets}
          allYearDates={allYearDates}
          progressRecords={progressRecords}
          subjectId={activeSubjectId}
          onApply={handleAutoFillApply}
          onClose={() => setShowAutoFill(false)}
        />
      )}
    </div>
  );
}
