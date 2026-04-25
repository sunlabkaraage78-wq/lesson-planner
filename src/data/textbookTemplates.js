// 教科書テンプレートデータ
// 構造: { id, subject, publisher, units: [大単元] }
// 大単元: { name, children: [中単元] }
// 中単元: { name, children: [小単元] }
// 小単元: { name }

export const TEXTBOOK_TEMPLATES = [
  // ---- 化学基礎 ----
  {
    id: 'chem_basic_mext',
    subject: '化学基礎',
    publisher: '学習指導要領',
    units: [
      {
        name: '化学と人間生活',
        children: [
          { name: '化学と物質', children: [] },
        ],
      },
      {
        name: '物質の構成',
        children: [
          { name: '物質の構成粒子', children: [] },
          { name: '物質と化学結合', children: [] },
        ],
      },
      {
        name: '物質の変化とその利用',
        children: [
          { name: '物質量と化学反応式', children: [] },
          { name: '化学反応', children: [] },
          { name: '化学が拓く世界', children: [] },
        ],
      },
    ],
  },
  {
    id: 'chem_basic_keirin',
    subject: '化学基礎',
    publisher: '啓林館',
    units: [
      {
        name: '物質の構成',
        children: [
          { name: '物質の構成粒子', children: [{ name: '純物質と混合物' }, { name: '単体と化合物・同素体' }, { name: '分離と精製' }] },
          { name: '原子の構造', children: [{ name: '原子の構成粒子' }, { name: '電子配置' }, { name: '元素の周期律と周期表' }] },
          { name: '化学結合', children: [{ name: 'イオンとイオン結合' }, { name: '共有結合と分子' }, { name: '共有結合の結晶' }, { name: '金属結合と金属結晶' }, { name: '分子間力と分子結晶' }] },
        ],
      },
      {
        name: '物質の変化',
        children: [
          { name: '物質量と化学反応式', children: [{ name: '原子量・分子量・式量' }, { name: '物質量（mol）' }, { name: '溶液の濃度' }, { name: '化学反応式' }, { name: '化学反応の量的関係' }] },
          { name: '酸・塩基と中和', children: [{ name: '酸と塩基' }, { name: '水素イオン濃度とpH' }, { name: '中和反応と塩' }, { name: '中和滴定' }] },
          { name: '酸化還元反応', children: [{ name: '酸化と還元' }, { name: '酸化剤と還元剤' }, { name: '金属のイオン化傾向' }, { name: '電池' }, { name: '電気分解' }] },
        ],
      },
    ],
  },
  {
    id: 'chem_basic_tokyo',
    subject: '化学基礎',
    publisher: '東京書籍',
    units: [
      { name: '化学と私たちの生活', children: [{ name: '身のまわりの物質', children: [{ name: '純物質と混合物' }, { name: '物質の分離・精製' }, { name: '元素・単体・化合物' }] }] },
      { name: '物質の構成粒子', children: [{ name: '原子', children: [{ name: '原子の構造' }, { name: '同位体' }, { name: '電子配置' }, { name: '元素の周期律' }] }, { name: '化学結合', children: [{ name: 'イオン結合と結晶' }, { name: '共有結合と分子' }, { name: '金属結合' }] }] },
      { name: '物質量と化学反応式', children: [{ name: '物質量', children: [{ name: 'mol（モル）' }, { name: '気体の体積' }, { name: '溶液の濃度' }] }, { name: '化学反応式', children: [{ name: '化学反応式の書き方' }, { name: '化学反応の量的関係' }] }] },
      { name: '酸と塩基', children: [{ name: '酸・塩基の定義と性質', children: [{ name: '酸と塩基' }, { name: '水素イオン濃度とpH' }] }, { name: '中和反応', children: [{ name: '中和反応と塩' }, { name: '中和滴定' }] }] },
      { name: '酸化還元反応', children: [{ name: '酸化と還元', children: [{ name: '酸化・還元の定義' }, { name: '酸化剤・還元剤' }] }, { name: '酸化還元の利用', children: [{ name: '金属のイオン化傾向' }, { name: '電池のしくみ' }, { name: '電気分解' }] }] },
    ],
  },

  // ---- 化学 ----
  {
    id: 'chem_mext',
    subject: '化学',
    publisher: '学習指導要領',
    units: [
      {
        name: '物質の状態と平衡',
        children: [
          { name: '物質の状態とその変化', children: [] },
          { name: '溶液と平衡', children: [] },
        ],
      },
      {
        name: '物質の変化と平衡',
        children: [
          { name: '化学反応とエネルギー', children: [] },
          { name: '化学反応と化学平衡', children: [] },
        ],
      },
      {
        name: '無機物質の性質',
        children: [
          { name: '典型元素', children: [] },
          { name: '遷移元素', children: [] },
        ],
      },
      {
        name: '有機化合物の性質',
        children: [
          { name: '有機化合物', children: [] },
          { name: '高分子化合物', children: [] },
        ],
      },
      {
        name: '化学が果たす役割',
        children: [
          { name: '人間生活の中の化学', children: [] },
        ],
      },
    ],
  },
  {
    id: 'chem_keirin',
    subject: '化学',
    publisher: '啓林館',
    units: [
      {
        name: '物質の状態と平衡',
        children: [
          { name: '物質の状態変化', children: [{ name: '気体の性質' }, { name: '気体の法則' }, { name: '液体と固体' }, { name: '状態変化と蒸気圧' }] },
          { name: '溶液', children: [{ name: '溶解とその過程' }, { name: '希薄溶液の性質' }, { name: 'コロイド溶液' }] },
        ],
      },
      {
        name: '物質の変化と平衡',
        children: [
          { name: '化学反応と熱・光', children: [{ name: '反応エンタルピー' }, { name: 'ヘスの法則' }, { name: '結合エネルギー' }] },
          { name: '電気化学', children: [{ name: '電池' }, { name: '電気分解' }] },
          { name: '化学反応の速さと平衡', children: [{ name: '反応速度' }, { name: '化学平衡' }, { name: '平衡定数' }, { name: 'ルシャトリエの原理' }, { name: '電解質溶液の平衡' }] },
        ],
      },
      {
        name: '無機物質の性質',
        children: [
          { name: '非金属元素', children: [{ name: 'ハロゲン' }, { name: '酸素・硫黄' }, { name: '窒素・リン' }, { name: '炭素・ケイ素' }] },
          { name: '金属元素', children: [{ name: 'アルカリ金属' }, { name: '2族元素' }, { name: 'アルミニウム・亜鉛・スズ・鉛' }, { name: '鉄・銅・銀' }, { name: 'クロム・マンガン' }] },
        ],
      },
      {
        name: '有機化合物の性質',
        children: [
          { name: '有機化合物の特徴と分類', children: [{ name: '有機化合物の構造' }, { name: '異性体' }] },
          { name: '脂肪族化合物', children: [{ name: 'アルカン・アルケン・アルキン' }, { name: 'アルコール・エーテル' }, { name: 'アルデヒド・ケトン' }, { name: 'カルボン酸・エステル' }, { name: '油脂・セッケン' }] },
          { name: '芳香族化合物', children: [{ name: 'ベンゼンとその誘導体' }, { name: 'フェノール類' }, { name: '芳香族カルボン酸' }, { name: '芳香族アミン・アゾ化合物' }] },
        ],
      },
      {
        name: '高分子化合物',
        children: [
          { name: '合成高分子化合物', children: [{ name: '合成繊維' }, { name: '合成樹脂（プラスチック）' }, { name: 'ゴム' }] },
          { name: '天然高分子化合物', children: [{ name: '糖類' }, { name: 'タンパク質' }, { name: '核酸' }] },
        ],
      },
      {
        name: '化学が果たす役割',
        children: [
          { name: '人間生活の中の化学', children: [] },
        ],
      },
    ],
  },
  {
    id: 'math1_keirin',
    subject: '数学I',
    publisher: '啓林館',
    units: [
      {
        name: '数と式',
        children: [
          { name: '整式', children: [{ name: '整式の計算' }, { name: '因数分解' }] },
          { name: '実数', children: [{ name: '実数と平方根' }, { name: '絶対値' }] },
          { name: '不等式', children: [{ name: '一次不等式' }, { name: '連立不等式' }] },
        ],
      },
      {
        name: '2次関数',
        children: [
          { name: '関数とグラフ', children: [{ name: '2次関数のグラフ' }, { name: '最大値・最小値' }] },
          { name: '2次方程式と2次不等式', children: [{ name: '判別式' }, { name: '2次不等式' }] },
        ],
      },
      {
        name: '図形と計量',
        children: [
          { name: '三角比', children: [{ name: 'sin・cos・tan' }, { name: '三角比の相互関係' }] },
          { name: '三角形への応用', children: [{ name: '正弦定理' }, { name: '余弦定理' }, { name: '面積' }] },
        ],
      },
      {
        name: 'データの分析',
        children: [
          { name: 'データの整理', children: [{ name: '代表値' }, { name: '分散・標準偏差' }] },
          { name: 'データの相関', children: [{ name: '散布図と相関係数' }] },
        ],
      },
    ],
  },
  {
    id: 'physics_basic_keirin',
    subject: '物理基礎',
    publisher: '啓林館',
    units: [
      {
        name: '運動とエネルギー',
        children: [
          { name: '運動の表し方', children: [{ name: '速さと速度' }, { name: '加速度' }, { name: '自由落下' }] },
          { name: '力', children: [{ name: '力のつり合い' }, { name: '作用・反作用' }] },
          { name: '運動の法則', children: [{ name: 'ニュートンの運動方程式' }, { name: '摩擦力' }] },
          { name: 'エネルギー', children: [{ name: '仕事とエネルギー' }, { name: 'エネルギーの保存' }] },
        ],
      },
      {
        name: '熱',
        children: [
          { name: '熱と温度', children: [{ name: '温度と熱' }, { name: '熱膨張' }] },
          { name: '熱と仕事', children: [{ name: '比熱と熱容量' }, { name: '熱力学第一法則' }] },
        ],
      },
      {
        name: '波',
        children: [
          { name: '波の性質', children: [{ name: '波の表し方' }, { name: '波の重ね合わせ' }, { name: '波の反射・屈折' }] },
          { name: '音', children: [{ name: '音の性質' }, { name: 'ドップラー効果' }] },
          { name: '光', children: [{ name: '光の反射・屈折' }, { name: '光の分散・回折' }] },
        ],
      },
      {
        name: '電気',
        children: [
          { name: '電場と電位', children: [{ name: 'クーロンの法則' }, { name: '電場と電位' }] },
          { name: '電流', children: [{ name: 'オームの法則' }, { name: '電力と電力量' }] },
          { name: '磁場', children: [{ name: '磁場と磁力' }, { name: '電磁誘導' }] },
        ],
      },
    ],
  },
  {
    id: 'biology_basic_keirin',
    subject: '生物基礎',
    publisher: '啓林館',
    units: [
      {
        name: '生物の特徴',
        children: [
          { name: '生物の共通性', children: [{ name: '生命の共通性と多様性' }, { name: '細胞の構造' }] },
          { name: 'エネルギーと代謝', children: [{ name: 'ATPとエネルギー' }, { name: '光合成と呼吸' }] },
          { name: '遺伝情報', children: [{ name: 'DNAと遺伝情報' }, { name: '遺伝情報の発現' }] },
        ],
      },
      {
        name: '生物の体内環境',
        children: [
          { name: '体内環境の維持', children: [{ name: '血液と体液' }, { name: '免疫' }] },
          { name: '神経とホルモン', children: [{ name: '神経系' }, { name: 'ホルモンと体内環境' }] },
        ],
      },
      {
        name: '生物の多様性と生態系',
        children: [
          { name: '植生と遷移', children: [{ name: '植生の種類' }, { name: '遷移' }] },
          { name: '生態系', children: [{ name: '生態系の構成' }, { name: '物質循環とエネルギー' }, { name: '生態系のバランス' }] },
        ],
      },
    ],
  },
];

// 科目名の一覧（重複なし）
export const TEMPLATE_SUBJECTS = [...new Set(TEXTBOOK_TEMPLATES.map(t => t.subject))];

// 科目名から対応するテンプレート一覧を取得
export function getTemplatesBySubject(subject) {
  return TEXTBOOK_TEMPLATES.filter(t => t.subject === subject);
}
