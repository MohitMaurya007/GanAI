from __future__ import annotations

from datetime import datetime
from flask import Blueprint, redirect, render_template, request, url_for, flash

from . import db
from .models import Employee, Task, TimeEntry


bp = Blueprint("main", __name__)


@bp.route("/")
def dashboard():
	employee_count = Employee.query.count()
	open_tasks = Task.query.filter(Task.status != "done").count()
	completed_tasks = Task.query.filter(Task.status == "done").count()
	recent_entries = (
		TimeEntry.query.order_by(TimeEntry.started_at.desc()).limit(10).all()
	)
	return render_template(
		"dashboard.html",
		employee_count=employee_count,
		open_tasks=open_tasks,
		completed_tasks=completed_tasks,
		recent_entries=recent_entries,
	)


@bp.route("/employees")
def employees():
	employees = Employee.query.order_by(Employee.created_at.desc()).all()
	return render_template("employees.html", employees=employees)


@bp.route("/employees/add", methods=["POST"])
def add_employee():
	name = request.form.get("name", "").strip()
	role = request.form.get("role", "").strip()
	if not name:
		flash("Name is required", "error")
		return redirect(url_for("main.employees"))
	db.session.add(Employee(name=name, role=role))
	db.session.commit()
	flash("Employee added", "success")
	return redirect(url_for("main.employees"))


@bp.route("/tasks")
def tasks():
	tasks = Task.query.order_by(Task.created_at.desc()).all()
	employees = Employee.query.all()
	return render_template("tasks.html", tasks=tasks, employees=employees)


@bp.route("/tasks/add", methods=["POST"])
def add_task():
	title = request.form.get("title", "").strip()
	description = request.form.get("description")
	employee_id = request.form.get("employee_id")
	if not title:
		flash("Title is required", "error")
		return redirect(url_for("main.tasks"))
	task = Task(title=title, description=description)
	if employee_id:
		task.employee_id = int(employee_id)
	db.session.add(task)
	db.session.commit()
	flash("Task created", "success")
	return redirect(url_for("main.tasks"))


@bp.route("/tasks/<int:task_id>/status", methods=["POST"])
def update_task_status(task_id: int):
	status = request.form.get("status", "todo")
	task = Task.query.get_or_404(task_id)
	task.status = status
	if status == "done" and not task.completed_at:
		task.completed_at = datetime.utcnow()
	db.session.commit()
	flash("Task updated", "success")
	return redirect(url_for("main.tasks"))


@bp.route("/time")
def time_entries():
	entries = TimeEntry.query.order_by(TimeEntry.started_at.desc()).all()
	employees = Employee.query.all()
	tasks = Task.query.all()
	return render_template("time.html", entries=entries, employees=employees, tasks=tasks)


@bp.route("/time/add", methods=["POST"])
def add_time_entry():
	employee_id = int(request.form.get("employee_id"))
	hours = float(request.form.get("hours", 0))
	description = request.form.get("description")
	task_id_raw = request.form.get("task_id")
	task_id = int(task_id_raw) if task_id_raw else None
	entry = TimeEntry(
		employee_id=employee_id,
		hours=hours,
		description=description,
	)
	if task_id:
		entry.task_id = task_id
	db.session.add(entry)
	db.session.commit()
	flash("Time logged", "success")
	return redirect(url_for("main.time_entries"))


@bp.route("/init-db")
def init_db():
	"""Create tables and seed demo data once if empty."""
	db.create_all()
	if Employee.query.count() == 0:
		demo_emp = [
			Employee(name="Alice Johnson", role="Engineer"),
			Employee(name="Bob Smith", role="Designer"),
			Employee(name="Carol Lee", role="Manager"),
		]
		db.session.add_all(demo_emp)
		db.session.flush()
		demo_tasks = [
			Task(title="Set up project repo", description="Initialize Git and CI", employee_id=demo_emp[0].id),
			Task(title="Create landing page mockup", description="Figma draft", employee_id=demo_emp[1].id),
			Task(title="Plan sprint backlog", description="Groom stories", employee_id=demo_emp[2].id),
		]
		db.session.add_all(demo_tasks)
		db.session.commit()
		flash("Database initialized with demo data.", "success")
	else:
		flash("Database already initialized.", "info")
	return redirect(url_for("main.dashboard"))

