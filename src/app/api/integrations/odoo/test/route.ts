import { NextResponse } from 'next/server';
import { authenticateOdoo } from '@/lib/odooXmlRpc';

type OdooVersionInfo = {
  server_version?: string;
  protocol_version?: number;
};

export async function GET() {
  try {
    const { url, database, username, uid, version } = await authenticateOdoo();
    const typedVersion = version as OdooVersionInfo;

    return NextResponse.json({
      success: true,
      uid,
      serverVersion: typedVersion.server_version ?? null,
      protocolVersion: typedVersion.protocol_version ?? null,
      url,
      database,
      username,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal menghubungkan ke Odoo.';

    return NextResponse.json(
      {
        success: false,
        errorMessage,
      },
      { status: 500 }
    );
  }
}
