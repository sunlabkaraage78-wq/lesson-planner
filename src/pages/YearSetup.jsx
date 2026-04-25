import { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
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
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('timetable');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <StepNav />

      {/* main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-slate-200 overflow-x-auto">
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
    </div>
  );
}
