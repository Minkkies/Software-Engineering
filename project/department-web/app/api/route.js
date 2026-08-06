import { pool } from "@lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");

    return Response.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}