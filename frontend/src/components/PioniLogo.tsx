type PioniLogoProps = {
  alt?: string;
  className?: string;
  ink?: "header" | "footer";
  invert?: boolean;
};

export default function PioniLogo({
  alt = "Pioni",
  className = "",
  ink = "header",
  invert = false,
}: PioniLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      className={`pioni-logo pioni-logo--${ink}${invert ? " pioni-logo--invert" : ""}${className ? ` ${className}` : ""}`}
    />
  );
}
