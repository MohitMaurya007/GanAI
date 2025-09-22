import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DuplicateDetectionService } from "@/lib/duplicate-detection"
import { z } from "zod"
import { ValidationMethod } from "@prisma/client"

const configSchema = z.object({
  minSimilarityThreshold: z.number().min(0).max(100),
  minConfidenceThreshold: z.number().min(0).max(100),
  enabledMethods: z.array(z.nativeEnum(ValidationMethod)),
  autoApproveThreshold: z.number().min(0).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const config = configSchema.parse(body)

    await DuplicateDetectionService.updateDetectionConfig(config)

    return NextResponse.json({
      message: "Configuration updated successfully",
      config
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid configuration", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Config update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const config = await DuplicateDetectionService.getDetectionConfig()

    return NextResponse.json(config)

  } catch (error) {
    console.error("Config fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}