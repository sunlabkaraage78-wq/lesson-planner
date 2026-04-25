// 日本の祝日を計算するユーティリティ

// n番目の特定曜日を返す (例: 1月の第2月曜日)
function nthWeekday(year, month, weekday, n) {
  // weekday: 0=日, 1=月, ..., 6=土
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday) {
      count++;
      if (count === n) return d;
    }
  }
  return -1;
}

// 春分日・秋分日の近似計算 (1980〜2099年対応)
function vernalEquinox(year) {
  if (year <= 1979) return 20;
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function autumnalEquinox(year) {
  if (year <= 1979) return 23;
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

// 固定祝日と移動祝日を返す（振替休日・国民の祝日なし）
function baseHolidays(year) {
  const h = [];
  const add = (month, day, name) => h.push({ month, day, name });

  add(1, 1, '元日');
  add(1, nthWeekday(year, 0, 1, 2), '成人の日');
  add(2, 11, '建国記念の日');
  add(2, 23, '天皇誕生日');
  add(3, vernalEquinox(year), '春分の日');
  add(4, 29, '昭和の日');
  add(5, 3, '憲法記念日');
  add(5, 4, 'みどりの日');
  add(5, 5, 'こどもの日');
  add(7, nthWeekday(year, 6, 1, 3), '海の日');
  add(8, 11, '山の日');
  add(9, nthWeekday(year, 8, 1, 3), '敬老の日');
  add(9, autumnalEquinox(year), '秋分の日');
  add(10, nthWeekday(year, 9, 1, 2), 'スポーツの日');
  add(11, 3, '文化の日');
  add(11, 23, '勤労感謝の日');

  return h;
}

// 日付を "YYYY-MM-DD" 形式に変換
function fmt(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 指定年の日本の祝日マップを返す
 * @param {number} year
 * @returns {Object} { "YYYY-MM-DD": "祝日名", ... }
 */
export function getHolidays(year) {
  const base = baseHolidays(year);
  const map = {};

  // まず全ての基本祝日を登録
  for (const { month, day, name } of base) {
    if (day > 0) map[fmt(year, month, day)] = name;
  }

  // 振替休日: 祝日が日曜日 → 翌月曜日が振替（さらにそこも祝日なら翌日...）
  const allKeys = Object.keys(map).sort();
  for (const key of allKeys) {
    const d = new Date(key + 'T00:00:00');
    if (d.getDay() === 0) { // 日曜
      let sub = new Date(d);
      sub.setDate(sub.getDate() + 1);
      while (map[sub.toISOString().slice(0, 10)]) {
        sub.setDate(sub.getDate() + 1);
      }
      map[sub.toISOString().slice(0, 10)] = '振替休日';
    }
  }

  // 国民の祝日: 祝日と祝日に挟まれた平日（日・月以外）
  const allKeys2 = Object.keys(map).sort();
  for (let i = 0; i < allKeys2.length - 1; i++) {
    const d1 = new Date(allKeys2[i] + 'T00:00:00');
    const d2 = new Date(allKeys2[i + 1] + 'T00:00:00');
    const diff = (d2 - d1) / 86400000;
    if (diff === 2) {
      const mid = new Date(d1);
      mid.setDate(mid.getDate() + 1);
      const midKey = mid.toISOString().slice(0, 10);
      const dow = mid.getDay();
      if (!map[midKey] && dow !== 0 && dow !== 6) {
        map[midKey] = '国民の祝日';
      }
    }
  }

  return map;
}

/**
 * 学年度（4月〜翌3月）に対応する年の祝日を一括取得
 * @param {number} schoolYear 年度（例: 2025 → 2025年4月〜2026年3月）
 * @returns {Object} { "YYYY-MM-DD": "祝日名", ... }
 */
export function getSchoolYearHolidays(schoolYear) {
  const h1 = getHolidays(schoolYear);
  const h2 = getHolidays(schoolYear + 1);
  return { ...h1, ...h2 };
}
