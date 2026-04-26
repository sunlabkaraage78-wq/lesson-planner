/**
 * 単元ツリーを平坦化して順序付きリストに変換する
 * 小単元がない中単元 → 中単元名を使用
 * 中単元がない大単元 → 大単元名を使用
 * @returns { id, label, level }[] の配列（id は元ツリーの id）
 */
export function flattenUnitTree(tree) {
  const items = [];
  for (const large of (tree || [])) {
    if (!large.children?.length) {
      items.push({ id: large.id, label: large.name, level: 'large' });
    } else {
      for (const medium of large.children) {
        if (!medium.children?.length) {
          items.push({ id: medium.id, label: medium.name, level: 'medium' });
        } else {
          for (const small of medium.children) {
            items.push({ id: small.id, label: small.name, level: 'small' });
          }
        }
      }
    }
  }
  return items;
}

// 学期インデックスに対応する色
export const TERM_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
