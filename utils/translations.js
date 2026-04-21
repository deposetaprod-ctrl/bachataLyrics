export const translations = {
  fr: {
    // Navbar
    home: "Rechercher",
    passes: "Passes",
    musicality: "Musicalité",
    competitions: "Compétitions",
    jackAndJill: "Jack & Jill",
    logout: "Se déconnecter",
    
    // Search / Home
    searchPlaceholder: "Rechercher ...",
    noSongsFound: "Aucune chanson n'a été trouvée.",
    viewMatches: "Voir correspondances musicales",
    
    // Song Info
    by: "par",
    dancers: "Danseurs",
    showLyrics: "Voir les paroles",
    showMusicality: "Voir la musicalité",
    
    // Song Lyrics Headers
    vo: "VO (Espagnol)",
    vf: "VF (Français)",
    ve: "VF (Anglais)", // We use VE internally or EN
    translationTitle: "Traduction",
    originalTitle: "Original",

    // Culture
    culturalContext: "Explication et Contexte Culturel de la chanson",
    meaningTitle: "Signification",
    contextTitle: "Contexte",
    artistInfoTitle: "Info Artiste",

    // Audio Player
    play: "Lecture",
    pause: "Pause",

    // Footer
    about: "À propos",
    rights: "Tous droits réservés.",
    supportTheProject: "Soutenir le projet",
  },
  en: {
    // Navbar
    home: "Search",
    passes: "Passes",
    musicality: "Musicality",
    competitions: "Competitions",
    jackAndJill: "Jack & Jill",
    logout: "Logout",
    
    // Search / Home
    searchPlaceholder: "Search ...",
    noSongsFound: "No songs found.",
    viewMatches: "View musical matches",
    
    // Song Info
    by: "by",
    dancers: "Dancers",
    showLyrics: "Show lyrics",
    showMusicality: "Show musicality",
    
    // Song Lyrics Headers
    vo: "Original (Spanish)",
    vf: "French Translation",
    ve: "English Translation",
    translationTitle: "Translation",
    originalTitle: "Original",

    // Culture
    culturalContext: "Explanation and Cultural Context",
    meaningTitle: "Meaning",
    contextTitle: "Context",
    artistInfoTitle: "Artist Info",

    // Audio Player
    play: "Play",
    pause: "Pause",

    // Footer
    about: "About",
    rights: "All rights reserved.",
    supportTheProject: "Support the project",
  }
};

export function useTranslation(locale) {
  return function t(key) {
    if (!translations[locale]) {
      return translations['fr'][key] || key;
    }
    return translations[locale][key] || key;
  };
}
