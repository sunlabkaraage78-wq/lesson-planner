# 授業計画管理アプリ — 開発メモ

## 概要
高校教員向けの授業計画・進度管理ツール。React + Vite + TailwindCSS v4 で構築。
データはブラウザの localStorage に保存（年度ごと）。

## 技術スタック
- React 19 + Vite 8
- TailwindCSS v4（`@tailwindcss/vite` プラグイン）
- React Router DOM v7
- lucide-react（アイコン）
- Cloudflare Workers（本番ホスティング）
- GitHub Actions（自動デプロイ）

## デプロイ
- 本番URL: `https://lesson-planner.sunlab-karaage78.workers.dev`
- GitHub リポジトリ: `sunlabkaraage78-wq/lesson-planner`
- `main` ブランチへの push → GitHub Actions → Cloudflare Workers に自動デプロイ

## ローカル開発
```bash
npm install
npm run dev        # localhost:5173
npx vite --host    # スマホからLAN経由でアクセスする場合
```

## ディレクトリ構成
```
src/
  App.jsx                  # ルーティング定義
  context/
    AppContext.jsx          # グローバル状態管理（useReducer + localStorage）
  pages/
    YearSetup.jsx           # ①年度設定（時間割・科目・クラス・学期）
    EventCalendar.jsx       # ②行事カレンダー
    UnitPlanner.jsx         # ③単元配列
    ProgressView.jsx        # ④進度ビュー
  components/
    StepNav.jsx             # ヘッダー＋ステップナビ（Undo, Export/Import）
    TimetableGrid.jsx       # 週時間割グリッド（科目・クラス別色分け）
    ClassManager.jsx        # クラス管理＋科目×クラス担当設定マトリクス
    SubjectManager.jsx      # 科目管理
    TermSettings.jsx        # 学期設定
  utils/
    AppContext.jsx           # ※ context/ 内が正
    lessonDates.js          # 授業日生成ロジック（行事・祝日・振替考慮）
    unitUtils.js            # 単元ツリー平坦化 / TERM_COLORS
    holidays.js             # 祝日データ
```

## 主要な状態（AppContext）
```js
{
  schoolYear,        // 年度（例: 2025）
  gradeSystem,       // '3' | '4' | '6'（学年制）
  termType,          // '3semester' | '2semester' | 'exam4' | 'exam5'
  terms,             // 学期配列 [{ id, name, start, end }]
  subjects,          // 科目 [{ id, name, code }]
  classes,           // クラス [{ id, grade, group, lessonClass, displayName }]
  subjectClassLinks, // 担当設定 [{ subjectId, classId }]
  timetable,         // { 月: { '1': { type, subjectId, classId } } }
  periodsPerDay,     // 1日の時限数（デフォルト7）
  events,            // 行事 [{ id, type, name, date, scheduleImpact, ... }]
  unitTree,          // { [subjectId]: 大単元[] }
  termUnitBoundaries,// { [subjectId]: { [termId]: unitId } }
  progressRecords,   // { `${subjectId}_${classId}`: { [dateStr]: { content, note, shifted } } }
}
```

## 進度ビューのずらし機能
- `shifted: true` → そのコマを自習などでずらす。赤枠表示。後続コマへ内容を押し出す
- 「前倒し」ボタン → 現在コマから1コマ下の内容を引き上げ（進度が早いとき）
- Undo（元に戻す）は最大30回分、ページリロードでリセット

## 行事の授業への影響
- `full_cut` 全日カット
- `partial_cut` 部分カット（午前/午後/時限指定）
- `day_sub` 曜日変更（全時限）→ カレンダーに「〇曜授業」と表示
- `day_sub_partial` 曜日変更＋時限指定 → 「1〜3限〇曜授業」と表示
- `grade_specific` 学年別に個別指定

## 学年制
- `GRADE_SYSTEMS` を `AppContext.jsx` からエクスポート
- 3学年制（高校）/ 4学年制（高専）/ 6学年制（中高一貫）
- ClassManager のクラス追加フォームの学年選択肢に反映

## データ移行
- ヘッダーの「エクスポート」でJSON出力 → 別端末で「インポート」で復元
- localStorage はブラウザごとに独立（PC版とWeb版は別）
