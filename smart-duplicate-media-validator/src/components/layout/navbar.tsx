"use client"

import { signOut } from "next-auth/react"
import { BYPASS_AUTH } from "@/lib/test-auth"
import { UserRole } from "@/types/user"
import { useAuthSession } from "@/hooks/useAuthSession"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, User, Upload, Search, Shield } from "lucide-react"

export function Navbar() {
  const { data: session, status } = useAuthSession()

  if (status === "loading") {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                Smart Duplicate Media Validator
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Smart Duplicate Media Validator
            </span>
            <span className="font-bold sm:hidden">SDMV</span>
          </Link>
        </div>
        
        {session && (
          <div className="mr-4 hidden md:flex">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/upload"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                <Upload className="mr-2 h-4 w-4 inline" />
                Upload
              </Link>
              <Link
                href="/duplicates"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                <Search className="mr-2 h-4 w-4 inline" />
                Duplicates
              </Link>
              {(session.user.role === UserRole.ADMIN || session.user.role === UserRole.REVIEWER) && (
                <Link
                  href="/admin"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <Shield className="mr-2 h-4 w-4 inline" />
                  Admin
                </Link>
              )}
            </nav>
          </div>
        )}

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback>
                      {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {session.user.role.toLowerCase().replace('_', ' ')}
                    </p>
                    {BYPASS_AUTH && process.env.NODE_ENV === 'development' && (
                      <p className="text-xs leading-none text-orange-500 font-semibold">
                        🚨 TEST MODE
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}