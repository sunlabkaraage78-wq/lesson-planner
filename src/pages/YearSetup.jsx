import { useState } from 'react';
import { Save, CheckCircle, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GRADE_SYSTEMS } from '../context/AppContext';
import TimetableGrid from '../components/TimetableGrid';
import SubjectManager from '../components/SubjectManager';
import ClassManager from '../components/ClassManager';
import TermSettings from '../components/TermSettings';
import StepNav from '../components/StepNav';

const TABS = [
  { id: 'timetable', label: '時間割' },
  { id: 'subjects', label: '科目・クラス' },
  { id: 'terms', label: '学期設定' },
];

export default function YearSetup() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('timetable');
  const [saved, setSaved] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  const gradeSystem = state.gradeSystem || '3';

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <StepNav />

      {/* main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* tabs + grade system link */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1 flex-1 bg-white rounded-xl p-1 shadow-sm border border-slate-200 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
                style={activeTab === tab.id ? { backgroundColor: '#0f1f6e' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowGradeModal(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm whitespace-nowrap transition-colors"
          >
            <Settings size={12} />
            学年制を変更する
          </button>
        </div>

        {/* tab content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          {activeTab === 'timetable' && <TimetableGrid />}
          {activeTab === 'subjects' && (
            <div className="space-y-8">
              <SubjectManager />
              <div className="border-t border-slate-100 pt-6">
                <ClassManager />
              </div>
            </div>
          )}
          {activeTab === 'terms' && <TermSettings />}
        </div>

        {/* save button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all ${
              saved ? 'scale-95' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: saved ? '#0d9488' : '#0f1f6e' }}
          >
            {saved ? (
              <>
                <CheckCircle size={16} />
                保存しました
              </>
            ) : (
              <>
                <Save size={16} />
                設定を保存する
              </>
            )}
          </button>
        </div>
      </main>

      {/* 学年制変更モーダル */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowGradeModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800">学年制の設定</h3>
            <div className="space-y-2">
              {Object.entries(GRADE_SYSTEMS).map(([key, gs]) => (
                <button
                  key={key}
                  onClick={() => { dispatch({ type: 'SET_GRADE_SYSTEM', gradeSystem: key }); setShowGradeModal(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    gradeSystem === key
                      ? 'text-white border-transparent'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  style={gradeSystem === key ? { backgroundColor: '#0f1f6e' } : {}}
                >
                  {gs.label}
                  <span className="block text-xs font-normal mt-0.5 opacity-70">
                    {gs.grades.join('・')}年生
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGradeModal(false)}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
