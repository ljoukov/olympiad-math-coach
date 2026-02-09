import { EmailLoginForm } from "./email-login-form"

function getInitialEmailFromEnv(): string {
  const raw = process.env.TEST_USER_EMAIL_ID_PASSWORD
  if (!raw) return ""
  const [email] = raw.split("/")
  return email || ""
}

export default function LoginWithEmailPage() {
  const initialEmail = getInitialEmailFromEnv()
  return <EmailLoginForm initialEmail={initialEmail} />
}
