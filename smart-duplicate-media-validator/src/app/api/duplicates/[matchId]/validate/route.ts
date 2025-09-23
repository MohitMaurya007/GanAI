import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { DuplicateDetectionService } from "@/lib/duplicate-detection"
import { z } from "zod"

const validateSchema = z.object({
  action: z.enum(['approve', 'reject', 'archive', 'delete']),
  notes: z.string().optional(),
})

interface RouteParams {
  params: Promise<{
    matchId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { matchId } = await params
    const body = await request.json()
    const { action, notes } = validateSchema.parse(body)

    await DuplicateDetectionService.validateDuplicate(
      matchId,
      session.user.id,
      action,
      notes
    )

    return NextResponse.json({
      message: `Duplicate match ${action}d successfully`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Validation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}