import React from 'react';
import { Building2, Handshake, Globe } from 'lucide-react';

const Partners: React.FC = () => {
  return (
    <div className="space-y-12 w-full">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-text-primary">شركاء <span className="text-primary">النجاح</span></h2>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          نفخر بالتعاون مع نخبة من المؤسسات والشركات لدعم رواد الأعمال وتوفير أفضل الموارد لهم.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface aspect-video rounded-2xl shadow-sm border border-border flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer">
            <div className="text-center text-text-muted">
              <Building2 size={48} className="mx-auto mb-2 opacity-50" />
              <span className="font-bold">شريك {i}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-12 mt-16 border-t border-border/60 max-w-2xl mx-auto space-y-6">
        <Handshake size={48} className="mx-auto text-orange-600 mb-2" />
        <h3 className="text-2xl font-bold text-text-primary">هل ترغب في الانضمام لشركائنا؟</h3>
        <p className="text-text-secondary leading-relaxed">
          نحن نبحث دائماً عن شركاء يشاركونا نفس الرؤية لدعم بيئة ريادة الأعمال. تواصل معنا لبحث سبل التعاون.
        </p>
        <div className="pt-2">
          <a 
            href="https://wa.me/201034927416?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%20%D8%A8%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D9%86%20%D8%A3%D8%AC%D9%84%20%D8%A7%D9%84%D8%B4%D8%B1%D8%A7%D9%83%D8%A9%20%D9%85%D8%B9%20%D9%85%D9%86%D8%B5%D8%A9%20Business%20Creator."
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm hover:scale-[1.02]"
          >
            تواصل معنا للشراكة
          </a>
        </div>
      </div>
    </div>
  );
};

export default Partners;
