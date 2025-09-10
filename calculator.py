#!/usr/bin/env python3

"""A simple CLI calculator supporting +, -, *, / between two numbers.

Usage examples:
	python3 calculator.py 2 + 3
	python3 calculator.py 10 / 4
"""

from __future__ import annotations

import argparse
import sys
from typing import Callable, Dict


def add(left_operand: float, right_operand: float) -> float:
	return left_operand + right_operand


def subtract(left_operand: float, right_operand: float) -> float:
	return left_operand - right_operand


def multiply(left_operand: float, right_operand: float) -> float:
	return left_operand * right_operand


def divide(left_operand: float, right_operand: float) -> float:
	if right_operand == 0:
		raise ZeroDivisionError("Cannot divide by zero")
	return left_operand / right_operand


OPERATOR_TO_FUNCTION: Dict[str, Callable[[float, float], float]] = {
	"+": add,
	"-": subtract,
	"*": multiply,
	"/": divide,
}


def perform_calculation(left_operand: float, operator: str, right_operand: float) -> float:
	if operator not in OPERATOR_TO_FUNCTION:
		raise ValueError(
			f"Unsupported operator '{operator}'. Use one of: {', '.join(OPERATOR_TO_FUNCTION.keys())}"
		)
	operation_function = OPERATOR_TO_FUNCTION[operator]
	return operation_function(left_operand, right_operand)


def parse_arguments(argv: list[str]) -> argparse.Namespace:
	parser = argparse.ArgumentParser(
		description="Simple calculator for two operands and an operator"
	)
	parser.add_argument("left", type=float, help="Left operand (number)")
	parser.add_argument("operator", choices=list(OPERATOR_TO_FUNCTION.keys()), help="Operator: + - * /")
	parser.add_argument("right", type=float, help="Right operand (number)")
	return parser.parse_args(argv)


def format_result(value: float) -> str:
	# Show as integer if it is mathematically an integer, else show as float
	if value.is_integer():
		return str(int(value))
	return str(value)


def main() -> None:
	try:
		args = parse_arguments(sys.argv[1:])
		result = perform_calculation(args.left, args.operator, args.right)
		print(format_result(result))
	except ZeroDivisionError as division_error:
		print(f"Error: {division_error}", file=sys.stderr)
		sys.exit(1)
	except ValueError as value_error:
		print(f"Error: {value_error}", file=sys.stderr)
		sys.exit(2)


if __name__ == "__main__":
	main()

