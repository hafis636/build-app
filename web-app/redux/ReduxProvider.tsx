"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { useEffect } from "react";
import { setUserInfo } from "./userSlice";

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userInfoString = localStorage.getItem('userInfo');
    
    if (isLoggedIn && userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        store.dispatch(setUserInfo(userInfo));
      } catch (e) {
        console.error("Failed to parse userInfo from localStorage", e);
      }
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
