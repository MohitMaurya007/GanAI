#!/usr/bin/env python3

from typing import Optional


def build_greeting(name: Optional[str] = None) -> str:
	"""Return a friendly greeting string, optionally personalized with a name."""
	base_greeting = "Hello"
	if name:
		return f"{base_greeting}, {name}!"
	return f"{base_greeting}, world!"


def main() -> None:
	"""Entry point that prints the greeting. Accepts an optional name argument."""
	import sys
	name_argument = sys.argv[1] if len(sys.argv) > 1 else None
	print(build_greeting(name_argument))


if __name__ == "__main__":
	main()

