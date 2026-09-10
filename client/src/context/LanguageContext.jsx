import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'English'
  );
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    // If language is already in localStorage, don't auto-override unless they explicitly want it, 
    // but we'll try to fetch location anyway for demo purposes.
    if (!localStorage.getItem('language')) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationEnabled(true);
            const { latitude } = position.coords;
            // Mock Mapping based on Latitude for India
            // > 22 roughly North (Hindi), < 16 roughly South (Tamil/Telugu), else Marathi/English
            let autoLang = 'English';
            if (latitude > 22) autoLang = 'Hindi';
            else if (latitude < 16) autoLang = 'Tamil';
            else autoLang = 'Marathi';
            
            setLanguage(autoLang);
            localStorage.setItem('language', autoLang);
          },
          (error) => {
            console.warn("Geolocation denied or error:", error);
            setLanguage('English'); // Fallback
          }
        );
      }
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, locationEnabled }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
