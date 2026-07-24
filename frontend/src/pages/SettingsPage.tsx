import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isSettingsSection } from "../features/settings/settingsNav";

export default function SettingsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const id = isSettingsSection(section) ? section : "account";

  useEffect(() => {
    navigate(`/home#dialog/settings/${id}`, { replace: true });
  }, [id, navigate]);

  return null;
}
