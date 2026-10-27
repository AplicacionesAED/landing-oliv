import { useEffect } from "react";

const PORTAL_ID = "50442232";
const FORM_ID = "6b22924b-6cca-4508-b764-364917b3aeed";
const SCRIPT_ID = "hs-forms-embed-script";

export const HubSpotForm = () => {
  useEffect(() => {
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://js.hsforms.net/forms/embed/${PORTAL_ID}.js`;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div
      className="hs-form-frame"
      data-region="na1"
      data-form-id={FORM_ID}
      data-portal-id={PORTAL_ID}
    />
  );
};
