'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function verifyLogin(code: string) {
  console.log("--- Login Attempt Started ---");
  console.log("Input Code:", code);
  
  const envPassword = process.env.ADMIN_PASSWORD;
  console.log("System Password:", envPassword);

  if (!envPassword) {
      console.log("ERROR: Password not found in .env.local");
      return { success: false };
  }

  if (code === envPassword) {
    console.log("Password MATCH! Setting cookie...");
    const cookieStore = await cookies()
    
    // שינוי לטובת בדיקה: secure: false
    cookieStore.set('admin_token', 'SECRET_PASS', {
      httpOnly: true,
      secure: false, // חשוב לבדיקה בלוקאל
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, 
      path: '/',
    })
    
    console.log("Cookie set command sent. Redirecting...");
    redirect('/admin');
  } else {
    console.log("Password MISMATCH.");
  }
  
  return { success: false };
}