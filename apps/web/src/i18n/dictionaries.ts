/**
 * Lightweight, dependency-free i18n dictionary. Flat dot-keys keep lookups
 * simple; English is the fallback for any missing Urdu string. Arabic can be
 * added as another entry (the layout is already RTL-ready).
 */
export type Locale = 'en' | 'ur';

export const LOCALES: { code: Locale; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'nav.catalog': 'Catalog',
  'nav.cart': 'Cart',
  'nav.account': 'Account',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',
  'nav.language': 'Language',

  'home.eyebrow': 'Tailor Master · Bespoke Tailoring',
  'home.title': 'Made to measure, from style preview to a garment that actually fits.',
  'home.subtitle':
    'Browse the collection, personalise every detail, and order a garment tailored to your measurements — checked by a master tailor before it is made.',
  'home.browse': 'Browse catalog',

  'lane.preview': 'Style Preview',
  'lane.fit': 'Fit Recommendation',
  'lane.mtm': 'Made-to-Measure',

  'catalog.title': 'Browse garments',
  'catalog.all': 'All',

  'common.readySize': 'Ready size',
  'common.madeToMeasure': 'Made-to-measure',
  'common.addToCart': 'Add to cart',
  'common.customize': 'Customize this garment →',
  'common.checkout': 'Proceed to checkout →',
};

const ur: Dict = {
  'nav.catalog': 'کیٹلاگ',
  'nav.cart': 'کارٹ',
  'nav.account': 'اکاؤنٹ',
  'nav.signIn': 'سائن اِن',
  'nav.signOut': 'سائن آؤٹ',
  'nav.language': 'زبان',

  'home.eyebrow': 'ٹیلر ماسٹر · بیسپوک سلائی',
  'home.title': 'ناپ کے مطابق سلائی — اسٹائل پری ویو سے ایسا لباس جو واقعی فٹ ہو۔',
  'home.subtitle':
    'کیٹلاگ دیکھیں، ہر تفصیل اپنی پسند سے چنیں، اور اپنے ناپ کے مطابق لباس آرڈر کریں — جسے بننے سے پہلے ماسٹر ٹیلر جانچتا ہے۔',
  'home.browse': 'کیٹلاگ دیکھیں',

  'lane.preview': 'اسٹائل پری ویو',
  'lane.fit': 'فٹ تجویز',
  'lane.mtm': 'میڈ ٹو میژر',

  'catalog.title': 'لباس دیکھیں',
  'catalog.all': 'سب',

  'common.readySize': 'تیار سائز',
  'common.madeToMeasure': 'میڈ ٹو میژر',
  'common.addToCart': 'کارٹ میں شامل کریں',
  'common.customize': 'اس لباس کو کسٹمائز کریں ←',
  'common.checkout': 'چیک آؤٹ کی طرف ←',
};

export const dictionaries: Record<Locale, Dict> = { en, ur };
