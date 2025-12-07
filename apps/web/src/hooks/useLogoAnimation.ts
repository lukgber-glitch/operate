'use client';

import { useState, useEffect } from 'react';

const INTRO_SEEN_KEY = 'operate_intro_seen';

export function useLogoAnimation() {
  const [shouldShowIntro, setShouldShowIntro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY) === 'true';
    setShouldShowIntro(!hasSeenIntro);
    setIsLoading(false);
  }, []);

  const skipIntro = () => {
    setShouldShowIntro(false);
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
  };

  const markIntroSeen = () => {
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
  };

  return {
    shouldShowIntro,
    skipIntro,
    markIntroSeen,
    isLoading,
  };
}
