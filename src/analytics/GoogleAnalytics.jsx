import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();

function initializeGoogleTag() {
  if (!measurementId || window.__cakezeeGtagInitialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  if (!document.getElementById("cakezee-google-tag")) {
    const script = document.createElement("script");
    script.id = "cakezee-google-tag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  window.__cakezeeGtagInitialized = true;
}

function GoogleAnalytics() {
  const location = useLocation();
  const previousPath = useRef("");

  useEffect(() => {
    if (!measurementId || previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    initializeGoogleTag();

    const pageLocation = `${window.location.origin}${location.pathname}`;
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: pageLocation,
      page_path: location.pathname,
    });
  }, [location.pathname]);

  return null;
}

export default GoogleAnalytics;
