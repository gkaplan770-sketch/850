import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // נתיב הדף הנוכחי שהמשתמש מנסה לגשת אליו
  const path = request.nextUrl.pathname;

  // בדיקה: האם המשתמש מנסה להיכנס לאזור הניהול (/admin)
  // אנחנו מחריגים את דף ההתחברות עצמו (/admin/login) כדי לא ליצור לולאה אינסופית
  // וגם מוודאים שאנחנו לא חוסמים קבצים סטטיים בטעות
  if (path.startsWith('/admin') && path !== '/admin/login') {
    
    // בדיקה: האם קיים הקוקי (Cookie) של האישור שנתנו בדף הכניסה?
    const authCookie = request.cookies.get('admin-auth');

    // אם אין אישור כזה, או שהוא לא תקין
    if (!authCookie || authCookie.value !== 'true') {
      // "בעיטה" החוצה: הפניה מיידית לדף הכניסה
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // אם הכל בסדר (או שזה לא דף אדמין), תמשיך הלאה
  return NextResponse.next();
}

// הגדרה: על אילו נתיבים הקובץ הזה משפיע?
// במקרה שלנו: כל מה שמתחיל ב-/admin
export const config = {
  matcher: '/admin/:path*',
}