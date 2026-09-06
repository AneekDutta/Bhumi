"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "hi";
export type TextSize = "sm" | "base" | "lg";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  t: (key: string, fallback?: string) => string;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    "brand.title_hi": "भूमि — राष्ट्रीय भूमि अधिग्रहण एवं प्रबंधन प्रणाली",
    "brand.title_en": "BHUMI — National Land Acquisition & Management System",
    "brand.subline": "CALA — Central Authority for Land Acquisition",
    "brand.short": "BHUMI",
    "brand.cala": "CALA Directorate",
    "utility.helpline": "Emergency Helpline",
    "utility.email": "helpdesk-bhumi@cala.gov.in",
    "utility.role_cala": "CALA Officer | Competent Authority",
    "utility.welcome": "Welcome",

    // Navigation
    "nav.home": "Home",
    "nav.overview": "National Overview",
    "nav.portals": "Stakeholder Portals",
    "nav.register": "Highway Land Register",
    "nav.statutory": "Statutory (Sec 3A/3D)",
    "nav.awards": "Compensation Awards",
    "nav.mis": "MIS Reports",
    "nav.grievance": "Grievance Redressal",
    "nav.officer_login": "Officer Login",
    "nav.calculator": "Compensation Estimator",
    "nav.corridor_map": "Corridor GIS Map",
    "nav.statutory_mandate": "Statutory Mandate",
    "nav.field_app": "Field Surveyor App",
    "nav.citizen_portal": "Citizen Grievance Portal",

    // KPIs & Dashboard
    "kpi.active_projects": "Active Highway Projects",
    "kpi.active_projects_sub": "Major corridors currently in acquisition",
    "kpi.area_acquired": "Total Area Acquired",
    "kpi.area_acquired_sub": "Hectares under Section 3D/3G possession",
    "kpi.compensation": "Compensation Disbursed",
    "kpi.compensation_sub": "Direct Benefit Transfer (PFMS / Treasury)",
    "kpi.pending_notices": "Pending Notifications",
    "kpi.pending_notices_sub": "Section 3A gazettes awaiting objection window",
    "kpi.total_length": "Total Length",
    "kpi.total_length_sub": "Linear highway & expressways network",
    "kpi.villages_notified": "Villages Impacted",
    "kpi.villages_notified_sub": "Revenue cadastral divisions mapped",

    // Actions & Form
    "btn.officer_login": "Officer Login",
    "btn.sign_in": "Sign In to Console",
    "btn.demo_login": "One-Click CALA Officer Demo Login",
    "btn.track_status": "Track Grievance Status",
    "btn.search": "Search Records",
    "btn.filter": "Filter",
    "btn.reset": "Reset",
    "btn.export_pdf": "Export Corridor Brief",
    "btn.view_gazette": "View Gazette",

    // Ticker & Notices
    "ticker.heading": "OFFICIAL BULLETINS",
    "ticker.item1": "[GAZETTE S.O. 1428(E)] Section 3D declared for Delhi-Mumbai Expressway (NH-148N)",
    "ticker.item2": "[DBT MANDATE] Direct Benefit Transfer compensation clearance active across 14 corridors",
    "ticker.item3": "[STATUTORY HEARING] Section 3C objections hearing desk active for Kaimur & Dausa districts",

    // Footer & Legal
    "footer.disclaimer": "BHUMI Platform — Smart India Hackathon Prototype (SIH26016). Not an official government system.",
    "footer.framework": "Statutory Framework: RFCTLARR Act 2013 & National Highways Act 1956",
    "footer.authority": "Central Authority for Land Acquisition (CALA) Directorate",
  },
  hi: {
    // Brand & Header
    "brand.title_hi": "भूमि — राष्ट्रीय भूमि अधिग्रहण एवं प्रबंधन प्रणाली",
    "brand.title_en": "BHUMI — National Land Acquisition & Management System",
    "brand.subline": "सीएएलए — केंद्रीय भूमि अधिग्रहण प्राधिकरण",
    "brand.short": "भूमि",
    "brand.cala": "सीएएलए निदेशालय",
    "utility.helpline": "आपातकालीन हेल्पलाइन",
    "utility.email": "helpdesk-bhumi@cala.gov.in",
    "utility.role_cala": "सीएएलए अधिकारी | सक्षम प्राधिकारी",
    "utility.welcome": "स्वागत है",

    // Navigation
    "nav.home": "मुख्य पृष्ठ",
    "nav.overview": "राष्ट्रीय अवलोकन",
    "nav.portals": "हितधारक पोर्टल",
    "nav.register": "राजमार्ग भूमि रजिस्टर",
    "nav.statutory": "वैधानिक (धारा 3A/3D)",
    "nav.awards": "मुआवज़ा अधिनिर्णय",
    "nav.mis": "एमआईएस रिपोर्ट",
    "nav.grievance": "शिकायत निवारण",
    "nav.officer_login": "अधिकारी लॉगिन",
    "nav.calculator": "मुआवज़ा आगणक",
    "nav.corridor_map": "कॉरिडोर जीआईएस मानचित्र",
    "nav.statutory_mandate": "वैधानिक अधिदेश",
    "nav.field_app": "क्षेत्रीय सर्वेक्षक ऐप",
    "nav.citizen_portal": "नागरिक शिकायत पोर्टल",

    // KPIs & Dashboard
    "kpi.active_projects": "सक्रिय राजमार्ग परियोजनाएं",
    "kpi.active_projects_sub": "वर्तमान में अधिग्रहण प्रक्रियाधीन मुख्य कॉरिडोर",
    "kpi.area_acquired": "कुल अधिग्रहित क्षेत्र",
    "kpi.area_acquired_sub": "धारा 3D/3G के तहत अधिपत्य में हेक्टेयर भूमि",
    "kpi.compensation": "वितरित मुआवज़ा राशि",
    "kpi.compensation_sub": "प्रत्यक्ष लाभ अंतरण (PFMS / ट्रेजरी)",
    "kpi.pending_notices": "लंबित वैधानिक अधिसूचनाएं",
    "kpi.pending_notices_sub": "धारा 3A आपत्तियों की प्रतीक्षा कर रहे गजट",
    "kpi.total_length": "कुल कॉरिडोर लंबाई",
    "kpi.total_length_sub": "राष्ट्रीय राजमार्ग एवं एक्सप्रेसवे नेटवर्क",
    "kpi.villages_notified": "प्रभावित राजस्व गांव",
    "kpi.villages_notified_sub": "मानचित्रित भू-अभिलेख प्रभाग",

    // Actions & Form
    "btn.officer_login": "अधिकारी लॉगिन",
    "btn.sign_in": "कंसोल में प्रवेश करें",
    "btn.demo_login": "एक-क्लिक सीएएलए अधिकारी डेमो लॉगिन",
    "btn.track_status": "शिकायत स्थिति जांचें",
    "btn.search": "अभिलेख खोजें",
    "btn.filter": "फ़िल्टर",
    "btn.reset": "रीसेट",
    "btn.export_pdf": "कॉरिडोर विवरण डाउनलोड करें",
    "btn.view_gazette": "गजट अधिसूचना देखें",

    // Ticker & Notices
    "ticker.heading": "आधिकारिक सूचनाएं",
    "ticker.item1": "[गजट S.O. 1428(E)] दिल्ली-मुंबई एक्सप्रेसवे हेतु धारा 3D अधिग्रहण घोषित",
    "ticker.item2": "[डीबीटी मैंडेट] 14 कॉरिडोरों में सीधे बैंक खाते में मुआवज़ा अंतरण सक्रिय",
    "ticker.item3": "[वैधानिक सुनवाई] कैमूर एवं दौसा जिलों में धारा 3C आपत्ति निवारण पीठ सक्रिय",

    // Footer & Legal
    "footer.disclaimer": "भूमि प्लेटफॉर्म — स्मार्ट इंडिया हैकथॉन प्रोटोटाइप (SIH26016)। यह कोई आधिकारिक सरकारी प्रणाली नहीं है।",
    "footer.framework": "वैधानिक ढांचा: RFCTLARR अधिनियम 2013 एवं राष्ट्रीय राजमार्ग अधिनियम 1956",
    "footer.authority": "केंद्रीय भूमि अधिग्रहण प्राधिकरण (CALA) निदेशालय",
  }
};

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  textSize: "base",
  setTextSize: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [textSize, setTextSizeState] = useState<TextSize>("base");

  const applyZoom = (size: TextSize) => {
    if (typeof document !== "undefined") {
      const zoomLevels: Record<TextSize, string> = {
        sm: "90%",
        base: "100%",
        lg: "112%",
      };
      (document.documentElement.style as any).zoom = zoomLevels[size];
      document.documentElement.classList.remove("text-size-sm", "text-size-base", "text-size-lg");
      document.documentElement.classList.add(`text-size-${size}`);
    }
  };

  // Load persisted preferences on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("bhumi_language") as Language;
      if (savedLang === "en" || savedLang === "hi") {
        setLanguageState(savedLang);
      }
      const savedSize = localStorage.getItem("bhumi_text_size") as TextSize;
      if (savedSize === "sm" || savedSize === "base" || savedSize === "lg") {
        setTextSizeState(savedSize);
        applyZoom(savedSize);
      } else {
        applyZoom("base");
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhumi_language", lang);
    }
  };

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhumi_text_size", size);
      applyZoom(size);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = DICTIONARY[language] || DICTIONARY.en;
    return dict[key] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, textSize, setTextSize, t }}>
      <div className={`app-text-size-${textSize}`}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
