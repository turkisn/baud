import { useLanguage } from '../context/LanguageContext';

export default function Terms() {
  const { t } = useLanguage();
  const sections = [
    [t('Using BUOD', 'استخدام BUOD'), t('Use the platform lawfully and do not attempt to bypass access controls, disrupt the service, or misuse another person’s account.', 'استخدم المنصة بشكل نظامي، ولا تحاول تجاوز ضوابط الوصول أو تعطيل الخدمة أو إساءة استخدام حساب شخص آخر.')],
    [t('Product data and files', 'بيانات المنتجات والملفات'), t('Product records, supplier information, BIM, 3D, and datasheet files may belong to their respective owners. Availability in BUOD does not transfer ownership or grant rights beyond the permissions shown with the item.', 'قد تعود ملكية سجلات المنتجات وبيانات الموردين وملفات BIM و3D وأوراق البيانات لأصحابها. إتاحتها في BUOD لا تنقل الملكية ولا تمنح حقوقاً تتجاوز الأذونات الموضحة مع العنصر.')],
    [t('Accounts', 'الحسابات'), t('You are responsible for keeping your sign-in information secure and for activity performed through your account. Contact the platform administrator if you suspect unauthorized access.', 'أنت مسؤول عن حماية بيانات تسجيل الدخول وعن النشاط المنفذ عبر حسابك. تواصل مع مدير المنصة إذا اشتبهت في وصول غير مصرح به.')],
    [t('Service status', 'حالة الخدمة'), t('This staging service is provided for evaluation and may change, pause, or contain incomplete content. Do not rely on it as the only copy of important files.', 'تُقدَّم خدمة Staging هذه للتقييم وقد تتغير أو تتوقف أو تتضمن محتوى غير مكتمل. لا تعتمد عليها كنسخة وحيدة من الملفات المهمة.')],
  ];
  return <LegalPage title={t('Terms of Use', 'شروط الاستخدام')} intro={t('These terms describe acceptable use of the BUOD staging platform.', 'توضح هذه الشروط الاستخدام المقبول لمنصة BUOD التجريبية.')} sections={sections} t={t}/>;
}

function LegalPage({ title, intro, sections, t }) {
  return <div className="bg-ivory px-6 pb-20 pt-28"><article className="mx-auto max-w-3xl rounded-3xl border border-sand bg-white p-7 shadow-card sm:p-12"><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">BUOD</p><h1 className="mt-3 text-3xl font-black text-dark-brown">{title}</h1><p className="mt-4 leading-7 text-light-brown">{intro}</p><p className="mt-2 text-xs text-light-brown">{t('Last updated: 17 August 2026', 'آخر تحديث: 17 أغسطس 2026')}</p><div className="mt-10 space-y-8">{sections.map(([heading, body]) => <section key={heading}><h2 className="text-lg font-bold text-dark-brown">{heading}</h2><p className="mt-2 leading-7 text-medium-brown">{body}</p></section>)}</div></article></div>;
}
