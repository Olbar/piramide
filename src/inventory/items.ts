import type { ItemDef } from '../core/types';

function item(id: string, name: string, category: ItemDef['category'], description: string): ItemDef {
  return { id, name, category, description };
}

export const ITEMS: Record<string, ItemDef> = {
  'bronze-key': item('bronze-key', 'Бронзовый ключ', 'key', 'Простой ключ из бронзы. Открывает обычные двери пирамиды.'),
  'silver-key': item('silver-key', 'Серебряный ключ', 'key', 'Ключ с серебряным скарабеем. Открывает залы стражей.'),
  'scarab-key': item('scarab-key', 'Ключ скарабея', 'key', 'Ключ в форме жука-скарабея, символ возрождения.'),
  'ankh-key': item('ankh-key', 'Ключ анкх', 'key', 'Ключ в форме анкха — знака жизни.'),
  'sun-key': item('sun-key', 'Солнечный ключ', 'key', 'Ключ с диском Ра. Открывает залы света.'),
  'moon-key': item('moon-key', 'Лунный ключ', 'key', 'Ключ с полумесяцем Хонсу. Открывает ночные проходы.'),
  'serpent-key': item('serpent-key', 'Ключ змеи', 'key', 'Ключ с уреем — священной коброй фараонов.'),
  'jackal-key': item('jackal-key', 'Ключ шакала', 'key', 'Ключ Анубиса. Открывает врата хранителей.'),
  'pharaoh-key': item('pharaoh-key', 'Ключ фараона', 'key', 'Главный ключ пирамиды. Открывает преддверие выхода.'),
  'golden-key': item('golden-key', 'Золотой ключ', 'golden-key', 'Редкий золотой ключ. Открывает сокровищницы и тайные двери.'),
  'golden-key-2': item('golden-key-2', 'Золотой ключ луны', 'golden-key', 'Второй золотой ключ, выкованный при свете луны.'),
  'golden-key-3': item('golden-key-3', 'Золотой ключ солнца', 'golden-key', 'Третий золотой ключ, закалённый в солнечных лучах.'),
  'artifact-scarab': item('artifact-scarab', 'Амулет скарабея', 'artifact', 'Древний амулет, приносящий удачу исследователю.'),
  'artifact-ankh': item('artifact-ankh', 'Золотой анкх', 'artifact', 'Символ вечной жизни, найденный в глубинах пирамиды.'),
  'artifact-eye': item('artifact-eye', 'Око Хора', 'artifact', 'Всевидящее око. Хранит часть тайны кристалла.'),
  'artifact-jackal': item('artifact-jackal', 'Статуэтка Анубиса', 'artifact', 'Проводник душ. Часть древней тайны фараона.'),
  'artifact-falcon': item('artifact-falcon', 'Сокол Хора', 'artifact', 'Золотой сокол — символ царской власти.'),
  'artifact-lotus': item('artifact-lotus', 'Лотос творения', 'artifact', 'Цветок, из которого, по легенде, родился мир.'),
  'magic-amulet': item('magic-amulet', 'Магический амулет', 'magic', 'Позволяет видеть скрытые проходы: они начинают мерцать.'),
  'ancient-symbol': item('ancient-symbol', 'Древний символ', 'magic', 'Каменная печать с символом. Открывает древние механизмы.'),
  'sand-compass': item('sand-compass', 'Песчаный компас', 'magic', 'Указывает направление к ближайшему неразгаданному секрету.'),
  'flame-ward': item('flame-ward', 'Оберег пламени', 'magic', 'На короткое время защищает от огня и лавы.'),
  'main-crystal': item('main-crystal', 'Главный кристалл', 'crystal', 'Сердце пирамиды. Именно он запустил древнюю защиту.'),
};

for (let i = 1; i <= 12; i++) {
  const id = `inscription-${i}`;
  ITEMS[id] = item(id, `Фрагмент надписи №${i}`, 'inscription', 'Часть древнего послания. Собери все фрагменты, чтобы раскрыть тайну кристалла.');
}