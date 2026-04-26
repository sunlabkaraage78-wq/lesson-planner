// 時間割・行事カレンダーから授業実施日を自動生成するユーティリティ

const JP_DAYS = ['', '月', '火', '水', '木', '金']; // getDay() 1=月...5=金

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// その日に有効なイベントを取得
function getEventsForDate(dateStr, events) {
  return (events || []).filter(ev => {
    if (ev.date) return ev.date === dateStr;
    if (ev.dateStart && ev.dateEnd) return ev.dateStart <= dateStr && dateStr <= ev.dateEnd;
    return false;
  });
}

// 日付がどの学期に属するか
export function getTermLabel(dateStr, terms) {
  for (const t of (terms || [])) {
    if (t.start && t.end && dateStr >= t.start && dateStr <= t.end) return t.name;
  }
  return '';
}

/**
 * 指定した科目×クラスの授業実施日一覧を生成する
 * @returns string[] - YYYY-MM-DD のソート済み配列
 */
export function generateLessonDates({ subjectId, classId, schoolYear, timetable, events, holidays, terms, periodsPerDay, classes }) {
  // grade_specific 判定用：このクラスの学年
  const classGrade = String((classes || []).find(c => c.id === classId)?.grade || '');
  // 対象スロット（曜日×時限）を取得
  const slots = [];
  for (const [day, periods] of Object.entries(timetable || {})) {
    for (const [period, cell] of Object.entries(periods || {})) {
      if (cell?.subjectId === subjectId && cell?.classId === classId) {
        slots.push({ day, period: Number(period) });
      }
    }
  }
  if (slots.length === 0) return [];

  const lessonDates = [];
  const d = new Date(schoolYear, 3, 1); // 4月1日
  const end = new Date(schoolYear + 1, 2, 31); // 翌年3月31日
  const halfPeriod = Math.ceil((periodsPerDay || 7) / 2); // 午前/午後の境界

  while (d <= end) {
    const dateStr = toDateStr(d);
    const dow = d.getDay(); // 0=日,1=月...6=土

    // 土日はスキップ
    if (dow === 0 || dow === 6) { d.setDate(d.getDate() + 1); continue; }

    // 祝日はスキップ
    if (holidays && holidays[dateStr]) { d.setDate(d.getDate() + 1); continue; }

    // 学期範囲チェック（学期設定がある場合のみ）
    const hasTerm = (terms || []).some(t => t.start && t.end);
    if (hasTerm && !getTermLabel(dateStr, terms)) { d.setDate(d.getDate() + 1); continue; }

    const dayEvents = getEventsForDate(dateStr, events);

    // grade_specific イベントからこのクラスの学年に対応する影響を解決するヘルパー
    function resolveGradeImpact(ev) {
      if (ev.scheduleImpact !== 'grade_specific') return null;
      return ev.gradeImpacts?.[classGrade] || null;
    }

    // 全日休み・長期休業 → スキップ
    const fullCut = dayEvents.some(ev => {
      if (ev.type === 'long_vacation' || ev.scheduleImpact === 'full_cut') return true;
      const gi = resolveGradeImpact(ev);
      return gi?.mode === 'full_cut';
    });
    if (fullCut) { d.setDate(d.getDate() + 1); continue; }

    // カットされる時限を収集
    const cutPeriods = new Set();
    let daySubstitute = null; // 曜日変更
    const periodSubstitutes = {}; // { period: subDay }

    function applyCutMode(cutMode, cutPeriodsArr) {
      if (cutMode === 'morning') {
        for (let p = 1; p <= halfPeriod; p++) cutPeriods.add(p);
      } else if (cutMode === 'afternoon') {
        for (let p = halfPeriod + 1; p <= (periodsPerDay || 7); p++) cutPeriods.add(p);
      } else if (cutMode === 'custom') {
        (cutPeriodsArr || []).forEach(p => cutPeriods.add(p));
      }
    }

    for (const ev of dayEvents) {
      const impact = ev.scheduleImpact || 'none';
      if (impact === 'partial_cut') {
        applyCutMode(ev.cutMode, ev.cutPeriods);
      }
      if (impact === 'grade_specific') {
        const gi = resolveGradeImpact(ev);
        if (gi?.mode === 'partial_cut') {
          applyCutMode(gi.cutMode, gi.cutPeriods);
        }
      }
      if (impact === 'day_sub') {
        daySubstitute = ev.subDay;
      }
      if (impact === 'day_sub_partial') {
        (ev.subPeriods || []).forEach(p => { periodSubstitutes[p] = ev.subDay; });
        // 指定外の時限はカット
        for (let p = 1; p <= (periodsPerDay || 7); p++) {
          if (!(ev.subPeriods || []).includes(p)) cutPeriods.add(p);
        }
      }
      // 種別が曜日変更の場合も反映
      if (ev.type === 'day_change' && ev.subDay) {
        daySubstitute = ev.subDay;
      }
    }

    // いずれかのスロットが有効かチェック
    const hasLesson = slots.some(slot => {
      if (cutPeriods.has(slot.period)) return false;
      const effectiveDay = periodSubstitutes[slot.period] || daySubstitute || JP_DAYS[dow];
      return effectiveDay === slot.day;
    });

    if (hasLesson) lessonDates.push(dateStr);

    d.setDate(d.getDate() + 1);
  }

  return lessonDates;
}

/**
 * 科目に紐づく全クラスの授業日をマージして、日付→クラス[] のマップを返す
 */
export function buildDateClassMap({ subjectId, classIds, schoolYear, timetable, events, holidays, terms, periodsPerDay, classes }) {
  const map = {}; // { dateStr: Set<classId> }
  for (const classId of classIds) {
    const dates = generateLessonDates({ subjectId, classId, schoolYear, timetable, events, holidays, terms, periodsPerDay, classes });
    for (const date of dates) {
      if (!map[date]) map[date] = new Set();
      map[date].add(classId);
    }
  }
  // Set → Array に変換してソート済み配列で返す
  return Object.fromEntries(
    Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, set]) => [date, [...set]])
  );
}
