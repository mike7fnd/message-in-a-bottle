
import { NextRequest, NextResponse } from 'next/server';
import { addVisit } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    // The IP address is available in the request headers.
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Use a secure, server-to-server API call to get location data.
    // We avoid calling external APIs from the client.
    const geoResponse = await fetch(
      `https://pro.ip-api.com/json/${ip}?key=F3hV8B0sD6pE1kS&fields=status,message,country,city`
    );

    if (!geoResponse.ok) {
        console.warn('Failed to fetch geolocation data from ip-api');
        // Still add a visit, but mark location as unknown.
        await addVisit('Unknown', 'Unknown');
        return NextResponse.json({ success: true, message: "Visit tracked with unknown location." });
    }

    const geoData = await geoResponse.json();

    if (geoData.status === 'success') {
      await addVisit(geoData.country || 'Unknown', geoData.city || 'Unknown');
      return NextResponse.json({ success: true, message: "Visit tracked successfully." });
    } else {
      console.warn('Geolocation lookup was not successful:', geoData.message);
      await addVisit('Unknown', 'Unknown');
      return NextResponse.json({ success: true, message: "Visit tracked with unknown location due to lookup failure." });
    }
  } catch (error) {
    console.error('Error in /api/track-visit:', error);
    // Even if tracking fails, we don't want to block the user or show an error.
    // We just log it on the server.
    return new NextResponse('Error tracking visit', { status: 500 });
  }
}
