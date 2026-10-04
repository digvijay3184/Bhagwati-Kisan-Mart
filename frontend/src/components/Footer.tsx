'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-high pt-space-xl pb-space-lg mt-auto border-t border-outline-variant/30">
      <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-gutter-desktop mb-space-xl">
        {/* Brand Col */}
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-sm mb-space-xs">
            <span className="material-symbols-outlined text-primary text-[28px]">agriculture</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">
              माँ भगवती किसान सेवा केंद्र
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            केंद्रीय कीटनाशक बोर्ड द्वारा मान्यता प्राप्त प्राधिकृत कृषि रक्षा केंद्र। उत्तर प्रदेश के किसानों के लिए 100% शुद्ध खाद, बीज एवं कीटनाशक की विश्वसनीय दुकान।
          </p>
          <div className="mt-space-sm font-code-md text-code-md text-on-surface-variant">
            Mandi Road, Main Bazar, Uttar Pradesh
          </div>
        </div>

        {/* Categories Col */}
        <div className="flex flex-col gap-space-sm">
          <span className="font-label-lg text-label-lg text-on-surface font-bold">
            विश्वसनीय श्रेणियां (Categories)
          </span>
          <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <li>
              <Link className="hover:text-primary transition-colors" href="/products?category=insecticide">
                कीटनाशक (Insecticides)
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="/products?category=fungicide">
                फफूंदनाशक (Fungicides)
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="/products?category=herbicide">
                खरपतवारनाशक (Herbicides)
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="/products?category=seed">
                प्रमाणित हाइब्रिड बीज (Hybrid Seeds)
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="/products?category=fertilizer">
                जैव उर्वरक व NPK (Fertilizers)
              </Link>
            </li>
          </ul>
        </div>

        {/* Helpline Col */}
        <div className="flex flex-col gap-space-sm">
          <span className="font-label-lg text-label-lg text-on-surface font-bold">
            किसान सहायता केंद्र (Helpline)
          </span>
          <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-col gap-space-xs shadow-sm">
            <span className="font-label-sm text-label-sm text-secondary font-bold">
              टोल-फ्री कृषि परामर्श:
            </span>
            <span className="font-headline-md text-headline-md text-primary font-bold">
              1800-890-5421
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              सोमवार से शनिवार: प्रातः 8:00 से शाम 7:00
            </span>
          </div>
          <div className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">mark_email_read</span>
            <span>bhagwati.kisan@seva.in</span>
          </div>
        </div>

        {/* Guarantees Col */}
        <div className="flex flex-col gap-space-sm">
          <span className="font-label-lg text-label-lg text-on-surface font-bold">
            किसान गारंटी व सेवाएं
          </span>
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
              <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
              <div>
                <div className="font-label-sm text-label-sm font-bold text-on-surface">100% असली उत्पाद</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">कंपनी से सीधे प्राधिकृत वितरण</div>
              </div>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
              <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
              <div>
                <div className="font-label-sm text-label-sm font-bold text-on-surface">पक्का जीएसटी बिल</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">सब्सिडी व क्लेम हेतु मान्य</div>
              </div>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[22px]">local_shipping</span>
              <div>
                <div className="font-label-sm text-label-sm font-bold text-on-surface">गाँव-गाँव सुरक्षित आपूर्ति</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">दुकान पिकअप अथवा घर पर डिलीवरी</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subfooter */}
      <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop pt-space-md border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between text-on-surface-variant font-label-sm text-label-sm gap-2">
        <p>© 2026 भगवती किसान मार्ट (Maa Bhagwati Kisan Seva Kendra). सर्वाधिकार सुरक्षित। उत्तर प्रदेश कृषि विपणन अनुसार पंजीकृत।</p>
        <div className="flex items-center gap-space-md md:gap-space-lg flex-wrap">
          <Link className="hover:text-on-surface" href="/orders">मेरे ऑर्डर</Link>
          <Link className="hover:text-on-surface" href="/profile">किसान प्रोफ़ाइल</Link>
          <Link className="hover:text-on-surface text-secondary font-bold flex items-center gap-1" href="/admin" id="footer-admin-link">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            संचालक पोर्टल (Staff/Admin)
          </Link>
        </div>
      </div>
    </footer>
  );
};
