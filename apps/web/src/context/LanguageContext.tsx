'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<string, { en: string; hi: string }> = {
  // Navigation Groups & Items
  'nav.operations': { en: 'Operations', hi: 'परिचालन' },
  'nav.action_center': { en: 'Officer Action Center', hi: 'अधिकारी कार्रवाई केंद्र' },
  'nav.dashboard': { en: 'National Dashboard', hi: 'राष्ट्रीय डैशबोर्ड' },
  'nav.gov_projects': { en: 'Government Projects', hi: 'सरकारी परियोजनाएं' },
  'nav.project_portfolio': { en: 'Project Portfolio', hi: 'परियोजना पोर्टफोलियो' },
  'nav.project_gis': { en: 'Project Spatial Map', hi: 'परियोजना स्थानिक मानचित्र' },
  'nav.landowner_acq': { en: 'Landowner & Acquisition', hi: 'भूस्वामी एवं भूमि अधिग्रहण' },
  'nav.landowner_cases': { en: 'Landowner Grievances', hi: 'भूस्वामी शिकायतें' },
  'nav.registered_parcels': { en: 'Registered Parcels', hi: 'पंजीकृत भूखंड' },
  'nav.field_verification': { en: 'Field Verification', hi: 'फील्ड सत्यापन' },
  'nav.land_parcel_map': { en: 'Land Parcel Map', hi: 'भूखंड मानचित्र' },
  'nav.intelligence': { en: 'Intelligence & Decision Support', hi: 'इंटेलिजेंस एवं निर्णय सहयोग' },
  'nav.assistant': { en: 'Intelligence & Voice', hi: 'इंटेलिजेंस एवं वॉइस' },
  'nav.golden_demo': { en: 'Golden Demo Flow', hi: 'गोल्डन डेमो फ्लो' },
  'nav.document_intelligence': { en: 'Document Intelligence', hi: 'दस्तावेज़ इंटेलिजेंस' },
  'nav.what_if': { en: 'What-If Simulation', hi: 'व्हाट-इफ़ सिमुलेशन' },
  'nav.statutory_timelines': { en: 'Statutory Timelines', hi: 'वैधानिक समय-सीमा' },
  'nav.governance_law': { en: 'Governance & Law', hi: 'शासन एवं विधि' },
  'nav.legal_rights': { en: 'Legal & Rights', hi: 'विधिक अधिकार केंद्र' },
  'nav.reports': { en: 'MIS Reports', hi: 'एमआईएस रिपोर्ट' },
  'nav.system_status': { en: 'System Status', hi: 'सिस्टम स्थिति' },
  'nav.appearance': { en: 'Appearance', hi: 'स्वरूप' },

  // Header & Brand
  'app.title': { en: 'BHUMI', hi: 'भूमि' },
  'app.prototype_tag': { en: 'SIH26016 Decision Support Prototype', hi: 'SIH26016 निर्णय सहयोग प्रोटोटाइप' },
  'app.emergency_helpline': { en: 'Emergency Helpdesk', hi: 'आपातकालीन सहायता डेस्क' },
  'app.welcome': { en: 'Welcome, ', hi: 'स्वागत है, ' },
  'app.cala_officer': { en: 'CALA Officer · Competent Authority', hi: 'सक्षम प्राधिकारी (CALA)' },
  'app.whatif_workbench': { en: 'What-If Workbench', hi: 'व्हाट-इफ़ कार्यक्षेत्र' },

  // Dashboard & Operations
  'dash.title': { en: 'Land Acquisition Operations Console', hi: 'भूमि अधिग्रहण परिचालन कंसोल' },
  'dash.subtitle': { en: 'Strategic Infrastructure Corridors and Cadastral Cases under RFCTLARR Act 2013 & NH Act 1956', hi: 'आरएफसीटीएलएआरआर 2013 और एनएच अधिनियम 1956 के तहत रणनीतिक गलियारे और भूखंड मामले' },
  'dash.command_ops': { en: 'CALA Directorate Operations', hi: 'CALA निदेशालय परिचालन' },
  'dash.synthetic_stream': { en: 'Rajasthan Corridor Benchmark Stream', hi: 'राजस्थान कॉरिडोर बेंचमार्क स्ट्रीम' },
  'dash.spatial_map': { en: 'Project Spatial Map', hi: 'परियोजना स्थानिक मानचित्र' },
  'dash.parcel_map': { en: 'Land Parcel Map', hi: 'भूखंड मानचित्र' },
  'dash.section_a_title': { en: 'Government Infrastructure Project Portfolio', hi: 'सरकारी अवसंरचना परियोजना पोर्टफोलियो' },
  'dash.section_a_tag': { en: 'SECTION A • NATIONAL INFRASTRUCTURE PROJECTS', hi: 'खंड क • राष्ट्रीय अवसंरचना परियोजनाएं' },
  'dash.section_b_title': { en: 'Landowner Grievances & Cadastral Acquisition Cases', hi: 'भूस्वामी शिकायतें एवं भूखंड अधिग्रहण मामले' },
  'dash.section_b_tag': { en: 'SECTION B • LANDOWNER CASES & DIRECTIVES', hi: 'खंड ख • भूस्वामी मामले एवं निर्देश' },
  'dash.view_directory': { en: 'View Full Directory', hi: 'संपूर्ण निर्देशिका देखें' },
  'dash.view_queue': { en: 'View Full Cases Queue', hi: 'संपूर्ण मामला कतार देखें' },

  // KPIs
  'kpi.total_length': { en: 'Total Length', hi: 'कुल लंबाई' },
  'kpi.planned_acq': { en: 'Planned Acquisition', hi: 'नियोजित अधिग्रहण' },
  'kpi.acquired_to_date': { en: 'Acquired to Date', hi: 'अब तक अधिग्रहित' },
  'kpi.bottlenecks': { en: 'Corridor Bottlenecks', hi: 'कॉरिडोर रुकावटें' },
  'kpi.registered_parcels': { en: 'Registered Parcels', hi: 'पंजीकृत भूखंड' },
  'kpi.pending_inspection': { en: 'Pending Inspection', hi: 'लंबित निरीक्षण' },
  'kpi.verified_cases': { en: 'Verified Cases', hi: 'सत्यापित मामले' },
  'kpi.active_orders': { en: 'Active Orders', hi: 'सक्रिय आदेश' },
  'kpi.completed_awards': { en: 'Completed Awards', hi: 'पूर्ण किए गए अवार्ड' },
  'kpi.critical_parcels': { en: 'Critical Parcels', hi: 'महत्वपूर्ण भूखंड' },
  'kpi.overdue_clocks': { en: 'Overdue Clocks', hi: 'अतिदेय समय-सीमाएं' },
  'kpi.compensation_pending': { en: 'Compensation Pending', hi: 'लंबित मुआवज़ा' },
  'kpi.project_float': { en: 'Project Float', hi: 'परियोजना फ्लोट' },

  // Common Actions & Buttons
  'btn.search': { en: 'Search', hi: 'खोजें' },
  'btn.filter': { en: 'Filter', hi: 'फ़िल्टर' },
  'btn.export_csv': { en: 'Export CSV', hi: 'सीएसवी निर्यात करें' },
  'btn.export_json': { en: 'Export JSON', hi: 'जेसन निर्यात करें' },
  'btn.certify_verify': { en: 'Certify & Verify', hi: 'प्रमाणित एवं सत्यापित करें' },
  'btn.simulate': { en: 'Simulate', hi: 'सिमुलेशन चलाएं' },
  'btn.submit': { en: 'Submit', hi: 'जमा करें' },
  'btn.reset': { en: 'Reset', hi: 'रीसेट' },
  'btn.close': { en: 'Close', hi: 'बंद करें' },
  'btn.back': { en: 'Back', hi: 'वापस' },
  'btn.next': { en: 'Next', hi: 'आगे' },
  'btn.retry': { en: 'Retry Connection', hi: 'पुनः प्रयास करें' },
  'btn.track_status': { en: 'Track Status', hi: 'स्थिति जांचें' },

  // Statuses
  'status.critical': { en: 'CRITICAL', hi: 'गंभीर' },
  'status.high': { en: 'HIGH', hi: 'उच्च' },
  'status.medium': { en: 'MEDIUM', hi: 'मध्यम' },
  'status.low': { en: 'LOW', hi: 'कम' },
  'status.due_soon': { en: 'DUE SOON', hi: 'शीघ्र देय' },
  'status.overdue': { en: 'OVERDUE', hi: 'अतिदेय' },
  'status.pending_review': { en: 'PENDING REVIEW', hi: 'समीक्षा लंबित' },
  'status.verified': { en: 'VERIFIED', hi: 'सत्यापित' },
  'status.blocked': { en: 'BLOCKED', hi: 'अवरुद्ध' },
  'status.completed': { en: 'COMPLETED', hi: 'पूर्ण' },
  'status.active': { en: 'ACTIVE', hi: 'सक्रिय' },

  // Disclaimers & Alerts
  'disclaimer.synthetic': { en: 'BENCHMARK DEMO DATA · PROTOTYPE EVALUATION', hi: 'बेंचमार्क डेमो डेटा · प्रोटोटाइप मूल्यांकन' },
  'disclaimer.ai_advisory': { en: 'AI-GENERATED ADVISORY SUMMARY · DECISIONS REQUIRE AUTHORIZED OFFICER REVIEW', hi: 'एआई-जनित परामर्श सारांश · निर्णय के लिए अधिकृत अधिकारी की समीक्षा आवश्यक है' },
  'alert.overdue_warning': { en: 'Statutory deadline notice: Section 15 objection window on P00001 closes in 14 days.', hi: 'वैधानिक समय-सीमा सूचना: P00001 पर धारा 15 आपत्ति अवधि 14 दिनों में समाप्त होगी।' },

  // Home Page 30-Second Overview
  'home.hero_title': { en: 'Deterministic Land Acquisition Intelligence for Strategic Infrastructure', hi: 'रणनीतिक अवसंरचना के लिए निश्चित भूमि अधिग्रहण निर्णय सहायता' },
  'home.hero_sub': { en: 'Operational decision-support twin for CALA authorities under RFCTLARR Act 2013 & NH Act 1956.', hi: 'सक्षम प्राधिकारियों के लिए परिचालन निर्णय सहायता प्रणाली।' },
  'home.what_is_kosh': { en: '1. What is BHUMI?', hi: '१. भूमि क्या है?' },
  'home.what_problem': { en: '2. What Problem Does It Solve?', hi: '२. यह किस समस्या का समाधान करता है?' },
  'home.why_different': { en: '3. Why is it Different?', hi: '३. यह अन्य प्रणालियों से अलग क्यों है?' },
  'home.where_start': { en: '4. Where Do I Start?', hi: '४. शुरुआत कहाँ से करें?' },
  'home.track_heading': { en: 'Public Citizen Grievance Lookup', hi: 'नागरिक शिकायत स्थिति जांच' },
  'home.track_sub': { en: 'Track land acquisition objections, tree/crop valuations, and statutory hearing milestones.', hi: 'भूमि अधिग्रहण आपत्तियों, वृक्ष/फसल मूल्यांकन और वैधानिक सुनवाई की स्थिति जांचें।' }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('kosh-lang') || localStorage.getItem('bhumi-lang')) as Language | null;
      if (saved === 'en' || saved === 'hi') {
        setLanguageState(saved);
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('kosh-lang', lang);
      localStorage.setItem('bhumi-lang', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguage(next);
  };

  const t = (key: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    return entry[language] || entry.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (k: string) => DICTIONARY[k]?.en || k
    };
  }
  return context;
}
