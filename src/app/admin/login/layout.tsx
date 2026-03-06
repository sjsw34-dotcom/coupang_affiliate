// Login page uses its own layout (no admin header/auth check)
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
