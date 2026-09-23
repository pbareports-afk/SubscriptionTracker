import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    // Check for authorization header if you want to secure this endpoint
    // For Vercel Cron, you can verify the CRON_SECRET env variable

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const q = query(
      collection(db, 'subscriptions'),
      where('expiryDate', '<=', thirtyDaysFromNow),
      where('isNotified', '==', false)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return NextResponse.json({ message: 'No subscriptions need notification today.' });
    }

    const lineToken = process.env.LINE_NOTIFY_TOKEN;
    let notifiedCount = 0;

    for (const document of snapshot.docs) {
      const data = document.data();
      const title = data.title;
      const expiryDate = data.expiryDate.toDate();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      const message = `\n⚠️ แจ้งเตือนต่ออายุบริการ\n\nบริการ: ${title}\nผู้ให้บริการ: ${data.provider}\nวันหมดอายุ: ${expiryDate.toLocaleDateString('th-TH')}\nเหลือเวลาอีก: ${daysLeft} วัน\n\nรีบดำเนินการต่ออายุเพื่อป้องกันบริการหยุดชะงักครับ`;

      if (lineToken) {
        // Send to LINE Notify
        await fetch('https://notify-api.line.me/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${lineToken}`
          },
          body: `message=${encodeURIComponent(message)}`
        });
      }

      // Mark as notified in DB
      await updateDoc(doc(db, 'subscriptions', document.id), {
        isNotified: true
      });
      
      notifiedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${notifiedCount} notifications.` 
    });
    
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
