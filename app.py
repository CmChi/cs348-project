from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from models import db, Listing
from agents import agents_bp
# from buyers import buyers_bp
from homes import homes_bp
from listings import listings_bp
from offers import offers_bp
from subdivisions import subdivisions_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "postgresql://myuser:mypassword@db:5432/myapp_development")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.register_blueprint(agents_bp)
# app.register_blueprint(buyers_bp)
app.register_blueprint(homes_bp)
app.register_blueprint(listings_bp)
app.register_blueprint(offers_bp)
app.register_blueprint(subdivisions_bp)

db.init_app(app)

@app.route('/')
def index():
    return "🫦 Flask is alive, baby 🌹"

# with app.app_context():
#     conn = db.engine.raw_connection()
#     cursor = conn.cursor()

#     # Clean up in case it's already there
#     # cursor.execute("DEALLOCATE IF EXISTS generate_listing_report")

#     # Prepare the listing report statement
#     cursor.execute("""
#         PREPARE generate_listing_report(integer, integer) AS
#         SELECT l.*
#         FROM listings l
#         WHERE l.price BETWEEN $2 AND $1
#         ORDER BY l.price ASC;
#     """)

#     conn.commit()
#     cursor.close()
#     conn.close()

#     print("✅ Prepared statement 'generate_listing_report' loaded.")








if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)