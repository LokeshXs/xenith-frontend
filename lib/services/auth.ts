import axios from 'axios'

export async function checkSignupEmailExists(email: string): Promise<boolean> {
  const { data } = await axios.get<{ exists: boolean }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/email-exists`,
    {
      params: { email },
      timeout: 5000,
    },
  )

  return data.exists
}

export async function recordPostLogin(accessToken: string): Promise<void> {
  await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/post-login`,
    {},
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 5000,
    },
  )
}
