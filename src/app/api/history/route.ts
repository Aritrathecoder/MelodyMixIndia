/**
 * History API - Fetch and manage user's listening history
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '7');

        // Mock empty response since Supabase is disabled
        return NextResponse.json({
            history: {},
            totalPlays: 0,
            days,
        });

    } catch (error) {
        console.error('[History] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { track } = body;

        console.log('[History] Pretending to save play for:', track?.title || 'Unknown Track (Mocked)');

        return NextResponse.json({ success: true, mocked: true });

    } catch (error) {
        console.error('[History] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
