// API route: POST /api/analytics/event
import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/services/analytics.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload, ts } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'type required' },
        { status: 400 }
      );
    }

    // Track event (failures are non-critical)
    await analyticsService.trackEvent(type, payload || {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    // Analytics failures should not block user actions
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Analytics endpoint is working. Use POST to track events.',
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

