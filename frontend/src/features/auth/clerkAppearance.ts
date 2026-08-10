import type { Appearance } from "@clerk/shared/types";

export const clerkAppearance = {
  layout: {
    logoImageUrl: "/logo.svg",
    logoPlacement: "inside",
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
    termsPageUrl: "/terms",
    privacyPageUrl: "/privacy",
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: "#101114",
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: "#101114",
    colorMutedForeground: "#686B82",
    colorMuted: "rgba(104, 107, 130, 0.08)",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#101114",
    colorNeutral: "#686B82",
    colorBorder: "#D9D9D9",
    colorRing: "#101114",
    colorShadow: "rgba(16, 24, 40, 0.04)",
    borderRadius: "0.75rem",
    fontFamily:
      '"Archivo Variable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "w-full rounded-[20px] bg-white shadow-[0_1px_4px_rgba(16,24,40,0.04)]",
    card: "gap-4 rounded-[20px] bg-white px-6 py-6",
    logoBox: "mb-2 justify-center",
    logoImage: "pioni-logo pioni-logo--header",
    headerTitle:
      "text-center text-[28px] font-medium leading-9 tracking-tight text-[#101114]",
    headerSubtitle: "text-center text-sm text-[#686B82]",
    main: "gap-4",
    form: "gap-4",
    formFieldLabel: "text-xs font-medium text-[#686B82]",
    formFieldInput:
      "h-12 rounded-xl border border-[#D9D9D9] bg-white text-sm text-[#101114] placeholder:text-[#686B82] focus:border-[#101114] focus:ring-1 focus:ring-[#101114]",
    formButtonPrimary:
      "h-[52px] rounded-xl bg-[#101114] text-base font-medium normal-case tracking-normal text-white shadow-none hover:bg-[#2A2A2A]",
    socialButtonsBlockButton:
      "h-[52px] rounded-xl border-0 bg-[rgba(104,107,130,0.08)] text-base font-medium normal-case text-[#101114] shadow-none hover:bg-[rgba(104,107,130,0.12)]",
    socialButtonsBlockButtonText: "text-base font-medium text-[#101114]",
    dividerLine: "bg-[rgba(104,107,130,0.16)]",
    dividerText: "text-sm text-[#686B82]",
    footerActionText: "text-sm text-[#686B82]",
    footerActionLink:
      "text-sm font-medium text-[#101114] underline-offset-2 hover:underline",
    identityPreviewEditButton: "text-[#101114]",
    formFieldAction:
      "text-sm text-[#101114] underline-offset-2 hover:underline",
  },
} satisfies Appearance;

export const clerkLocalization = {
  socialButtonsBlockButton: "Sign in with {{provider|titleize}}",
  dividerText: "Or",
  formFieldLabel__emailAddress: "Email",
  formFieldLabel__emailAddress_username: "Email or username",
  formFieldLabel__password: "Password",
  formFieldInputPlaceholder__emailAddress: "Email address",
  formFieldInputPlaceholder__emailAddress_username: "Email or username",
  formFieldInputPlaceholder__password: "Password",
  formButtonPrimary: "Continue",
  signIn: {
    start: {
      title: "Sign in to Pioni",
      subtitle: " ",
      actionText: "Don't have an account?",
      actionLink: "Sign up",
    },
    password: {
      title: "Enter your password",
      subtitle: "to continue to Pioni",
    },
  },
  signUp: {
    start: {
      title: "Create an account",
      subtitle: "Access paper trading on Pioni",
      actionText: "Already have an account?",
      actionLink: "Sign in",
    },
  },
};
