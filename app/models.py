from __future__ import annotations

from datetime import datetime
from typing import Optional

from . import db


class Employee(db.Model):
	__tablename__ = "employees"

	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(120), nullable=False)
	role = db.Column(db.String(120), nullable=True)
	active = db.Column(db.Boolean, nullable=False, default=True)
	created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

	tasks = db.relationship("Task", backref="employee", lazy=True)
	time_entries = db.relationship("TimeEntry", backref="employee", lazy=True)

	def __repr__(self) -> str:  # pragma: no cover
		return f"<Employee {self.id} {self.name}>"


class Task(db.Model):
	__tablename__ = "tasks"

	id = db.Column(db.Integer, primary_key=True)
	title = db.Column(db.String(200), nullable=False)
	description = db.Column(db.Text, nullable=True)
	status = db.Column(db.String(50), nullable=False, default="todo")
	created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	completed_at = db.Column(db.DateTime, nullable=True)

	employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=True)

	def __repr__(self) -> str:  # pragma: no cover
		return f"<Task {self.id} {self.title}>"


class TimeEntry(db.Model):
	__tablename__ = "time_entries"

	id = db.Column(db.Integer, primary_key=True)
	started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	ended_at = db.Column(db.DateTime, nullable=True)
	hours = db.Column(db.Float, nullable=True)
	description = db.Column(db.String(255), nullable=True)

	employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=False)
	task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=True)

	task = db.relationship("Task", backref=db.backref("time_entries", lazy=True))

	def __repr__(self) -> str:  # pragma: no cover
		return f"<TimeEntry {self.id} {self.hours}h>"

