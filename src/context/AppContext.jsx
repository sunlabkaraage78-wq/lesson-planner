import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function fetchFromFirebase(year) {
  try {
    const snap = await getDoc(doc(db, 'states', `state_${year}`));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

async function saveToFirebase(state) {
  try {
    await setDoc(doc(db, 'states', `state_${state.schoolYear}`), state);
  } catch {}
}

const STORAGE_KEY_PREFIX = 'lessonPlanner_';

export const TERM_TEMPLATES = {
  '3semester': [
    { id: 1, name: '1学期', start: '', end: '' },
    { id: 2, name: '2学期', start: '', end: '' },
    { id: 3, name: '3学期', start: '', end: '' },
  ],
  '2semester': [
    { id: 1, name: '前期', start: '', end: '' },
    { id: 2, name: '後期', start: '', end: '' },
  ],
  'exam4': [
    { id: 1, name: '1学期中間', start: '', end: '' },
    { id: 2, name: '1学期期末', start: '', end: '' },
    { id: 3, name: '2学期中間', start: '', end: '' },
    { id: 4, name: '2学期期末', start: '', end: '' },
  ],
  'exam5': [
    { id: 1, name: '1学期中間', start: '', end: '' },
    { id: 2, name: '1学期期末', start: '', end: '' },
    { id: 3, name: '2学期中間', start: '', end: '' },
    { id: 4, name: '2学期期末', start: '', end: '' },
    { id: 5, name: '学年末', start: '', end: '' },
  ],
};

// 学年制の定義
export const GRADE_SYSTEMS = {
  '3': { label: '3学年制（高校・デフォルト）', grades: [1, 2, 3] },
  '4': { label: '4学年制（高専向け）',         grades: [1, 2, 3, 4] },
  '6': { label: '6学年制（中高一貫校向け）',   grades: [1, 2, 3, 4, 5, 6] },
};

const defaultState = {
  schoolYear: new Date().getFullYear(),
  gradeSystem: '3',   // '3' | '4' | '6'
  termType: '3semester',
  terms: TERM_TEMPLATES['3semester'],
  subjects: [],
  classes: [],
  subjectClassLinks: [],
  timetable: {},
  periodsPerDay: 7,
  events: [],
  unitTree: {},             // { [subjectId]: LargeUnit[] }
  noUnitSubjects: [],       // 単元設定をスキップする科目IDリスト
  progressRecords: {},      // { `${subjectId}_${classId}`: { [dateStr]: { content, note } } }
  termUnitBoundaries: {},   // { [subjectId]: { [termId]: unitId | null } }
};

function getStorageKey(year) {
  return `${STORAGE_KEY_PREFIX}${year}`;
}

function loadFromStorage(year) {
  try {
    const raw = localStorage.getItem(getStorageKey(year));
    if (raw) return { ...defaultState, ...JSON.parse(raw), schoolYear: year };
  } catch {}
  return { ...defaultState, schoolYear: year };
}

function saveToStorage(state) {
  try {
    localStorage.setItem(getStorageKey(state.schoolYear), JSON.stringify(state));
  } catch {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_YEAR': {
      return loadFromStorage(action.year);
    }
    case 'SET_GRADE_SYSTEM':
      return { ...state, gradeSystem: action.gradeSystem };
    case 'SET_TERMS':
      return { ...state, terms: action.terms };
    case 'SET_TERM_TYPE':
      return { ...state, termType: action.termType, terms: TERM_TEMPLATES[action.termType] };
    case 'SET_PERIODS_PER_DAY':
      return { ...state, periodsPerDay: action.value };
    case 'ADD_SUBJECT': {
      const subject = { id: `s${Date.now()}`, name: action.name, code: action.code || '' };
      return { ...state, subjects: [...state.subjects, subject] };
    }
    case 'UPDATE_SUBJECT':
      return { ...state, subjects: state.subjects.map(s => s.id === action.id ? { ...s, ...action.data } : s) };
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter(s => s.id !== action.id),
        subjectClassLinks: state.subjectClassLinks.filter(l => l.subjectId !== action.id),
        timetable: removeSubjectFromTimetable(state.timetable, action.id),
      };
    case 'ADD_CLASS': {
      const cls = { id: `c${Date.now()}`, grade: action.grade, group: action.group, lessonClass: action.lessonClass || '', displayName: action.displayName };
      return { ...state, classes: [...state.classes, cls] };
    }
    case 'UPDATE_CLASS':
      return { ...state, classes: state.classes.map(c => c.id === action.id ? { ...c, ...action.data } : c) };
    case 'DELETE_CLASS':
      return {
        ...state,
        classes: state.classes.filter(c => c.id !== action.id),
        subjectClassLinks: state.subjectClassLinks.filter(l => l.classId !== action.id),
        timetable: removeClassFromTimetable(state.timetable, action.id),
      };
    case 'TOGGLE_SUBJECT_CLASS_LINK': {
      const exists = state.subjectClassLinks.some(l => l.subjectId === action.subjectId && l.classId === action.classId);
      return {
        ...state,
        subjectClassLinks: exists
          ? state.subjectClassLinks.filter(l => !(l.subjectId === action.subjectId && l.classId === action.classId))
          : [...state.subjectClassLinks, { subjectId: action.subjectId, classId: action.classId }],
      };
    }
    case 'SET_TIMETABLE_CELL': {
      const { day, period, cell } = action;
      return {
        ...state,
        timetable: { ...state.timetable, [day]: { ...(state.timetable[day] || {}), [period]: cell } },
      };
    }
    // --- 行事 ---
    case 'ADD_EVENT': {
      const event = { id: `ev${Date.now()}`, ...action.event };
      return { ...state, events: [...(state.events || []), event] };
    }
    case 'UPDATE_EVENT':
      return { ...state, events: (state.events || []).map(e => e.id === action.id ? { id: e.id, ...action.data } : e) };
    case 'DELETE_EVENT':
      return { ...state, events: (state.events || []).filter(e => e.id !== action.id) };
    case 'SET_UNIT_TREE':
      return { ...state, unitTree: { ...state.unitTree, [action.subjectId]: action.tree } };
    case 'TOGGLE_NO_UNIT_SUBJECT': {
      const list = state.noUnitSubjects || [];
      const has = list.includes(action.subjectId);
      return { ...state, noUnitSubjects: has ? list.filter(id => id !== action.subjectId) : [...list, action.subjectId] };
    }
    case 'SET_TERM_UNIT_BOUNDARY': {
      const subBoundaries = state.termUnitBoundaries || {};
      return {
        ...state,
        termUnitBoundaries: {
          ...subBoundaries,
          [action.subjectId]: {
            ...(subBoundaries[action.subjectId] || {}),
            [action.termId]: action.unitId,
          },
        },
      };
    }
    case 'SET_PROGRESS_RECORD': {
      const key = `${action.subjectId}_${action.classId}`;
      const existing = state.progressRecords || {};
      return {
        ...state,
        progressRecords: {
          ...existing,
          [key]: { ...(existing[key] || {}), [action.date]: action.record },
        },
      };
    }
    case 'IMPORT_STATE':
      return { ...action.data };
    default:
      return state;
  }
}

function removeSubjectFromTimetable(timetable, subjectId) {
  const next = {};
  for (const day of Object.keys(timetable)) {
    next[day] = {};
    for (const period of Object.keys(timetable[day])) {
      const cell = timetable[day][period];
      next[day][period] = cell.subjectId === subjectId ? { type: 'free' } : cell;
    }
  }
  return next;
}

function removeClassFromTimetable(timetable, classId) {
  const next = {};
  for (const day of Object.keys(timetable)) {
    next[day] = {};
    for (const period of Object.keys(timetable[day])) {
      const cell = timetable[day][period];
      next[day][period] = cell.classId === classId ? { type: 'free' } : cell;
    }
  }
  return next;
}

const AppContext = createContext(null);

const MAX_HISTORY = 30;
// 年度切り替えは履歴対象外（全状態が入れ替わるため）
const NON_UNDOABLE = new Set(['SET_YEAR']);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    loadFromStorage(new Date().getFullYear())
  );
  const [past, setPast] = useState([]);
  const saveTimer = useRef(null);

  // 起動時にFirebaseから最新データを取得してマージ
  useEffect(() => {
    fetchFromFirebase(state.schoolYear).then(fbData => {
      if (fbData && fbData.schoolYear) {
        dispatch({ type: 'IMPORT_STATE', data: fbData });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state変化時: localStorage + Firebaseに保存（Firebaseは1秒デバウンス）
  useEffect(() => {
    saveToStorage(state);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveToFirebase(state), 1000);
  }, [state]);

  const dispatchWithHistory = useCallback((action) => {
    if (!NON_UNDOABLE.has(action.type)) {
      setPast(prev => [...prev.slice(-(MAX_HISTORY - 1)), state]);
    }
    dispatch(action);
  }, [state]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast(p => p.slice(0, -1));
    dispatch({ type: 'IMPORT_STATE', data: prev });
  }, [past]);

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchWithHistory, undo, canUndo: past.length > 0 }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
