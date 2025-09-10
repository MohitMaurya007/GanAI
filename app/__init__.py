from __future__ import annotations

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def create_app() -> Flask:
	app = Flask(__name__)
	app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
	app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
		"DATABASE_URL", f"sqlite:///{os.path.abspath('productivity.db')}"
	)
	app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

	db.init_app(app)

	with app.app_context():
		from . import models  # noqa: F401
		from .routes import bp as main_bp
		app.register_blueprint(main_bp)

	return app

