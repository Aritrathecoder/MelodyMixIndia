/**
 * Cleanup Old History Cron Job
 * Runs daily to delete listening history older than 7 days
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Cleanup disabled. Backend removed.',
    });
}
