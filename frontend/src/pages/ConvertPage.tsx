import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConvert } from "../features/convert/ConvertContext";

export default function ConvertPage() {
  const { openConvert } = useConvert();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/home", { replace: true });
    openConvert("USD", "BTC");
  }, [openConvert, navigate]);

  return null;
}
