import datetime
from flask import Blueprint, request, jsonify
from models import db, Home, Listing, Offer, AgentListing
from sqlalchemy.exc import SQLAlchemyError
from prepared_statements import prepare_statement

homes_bp = Blueprint('homes', __name__, url_prefix='/homes')

# GET /homes
@homes_bp.route('/', methods=['GET'])
def index():
    conn = db.engine.raw_connection()
    cur = conn.cursor()
    homes = []
    if request.args.get('searchText'):
        prepare_statement(conn, 'search_homes', """
            PREPARE search_homes(text) AS
            SELECT id 
            FROM homes 
            WHERE 
                street ILIKE '%' || $1 || '%'
                OR city ILIKE '%' || $1 || '%'
            LIMIT 10;
        """)
        cur.execute('EXECUTE search_homes(%s)', (request.args.get('searchText').replace('"', ''),))
        ids = [row[0] for row in cur.fetchall()]
        print(ids)
        homes = Home.query.filter(Home.id.in_(ids)).all()
    else:
        homes = Home.query.order_by(Home.id.asc()).all()
    cur.close()
    conn.close()
    return jsonify([{
        "id": home.id,
        "street": home.street,
        "city": home.city,
        "zip": home.zip,
        "beds": home.beds,
        "baths": home.baths,
        "sqft": home.sqft,
        "build_year": home.build_year,
        "subdivision_id": home.subdivision_id,
        "created_at": home.created_at.isoformat(),
        "updated_at": home.updated_at.isoformat()
    } for home in homes]), 200

# # GET /homes/<id>
# @homes_bp.route('/<int:home_id>', methods=['GET'])
# def show(home_id):
#     home = Home.query.get_or_404(home_id)
#     return jsonify({
#         "id": home.id,
#         "street": home.street,
#         "city": home.city,
#         "zip": home.zip,
#         "beds": home.beds,
#         "baths": home.baths,
#         "sqft": home.sqft,
#         "build_year": home.build_year,
#         "subdivision_id": home.subdivision_id,
#         "created_at": home.created_at.isoformat(),
#         "updated_at": home.updated_at.isoformat()
#     }), 200

# POST /homes
@homes_bp.route('/', methods=['POST'], strict_slashes=False)
def create():
    data = request.get_json()
    home = Home(
        street=data.get('street'),
        city=data.get('city'),
        zip=data.get('zip'),
        beds=data.get('beds'),
        baths=data.get('baths'),
        sqft=data.get('sqft'),
        build_year=data.get('build_year'),
        subdivision_id=data.get('subdivision_id'),
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now()
    )
    try:
        db.session.add(home)
        db.session.commit()
        return jsonify({
            "id": home.id,
            "street": home.street,
            "city": home.city,
            "zip": home.zip,
            "beds": home.beds,
            "baths": home.baths,
            "sqft": home.sqft,
            "build_year": home.build_year,
            "subdivision_id": home.subdivision_id,
            "created_at": home.created_at.isoformat(),
            "updated_at": home.updated_at.isoformat()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 422

# PUT /homes/<id>
@homes_bp.route('/<int:home_id>', methods=['PUT', 'PATCH'])
def update(home_id):
    home = Home.query.get_or_404(home_id)
    data = request.get_json().get('home')

    home.street = data.get('street', home.street)
    home.city = data.get('city', home.city)
    home.zip = data.get('zip', home.zip)
    home.beds = data.get('beds', home.beds)
    home.baths = data.get('baths', home.baths)
    home.sqft = data.get('sqft', home.sqft)
    home.build_year = data.get('build_year', home.build_year)
    home.subdivision_id = data.get('subdivision_id', home.subdivision_id)

    try:
        db.session.commit()
        return jsonify({
            "id": home.id,
            "street": home.street,
            "city": home.city,
            "zip": home.zip,
            "beds": home.beds,
            "baths": home.baths,
            "sqft": home.sqft,
            "build_year": home.build_year,
            "subdivision_id": home.subdivision_id,
            "created_at": home.created_at.isoformat(),
            "updated_at": home.updated_at.isoformat()
        }), 200
    except:
        db.session.rollback()
        return jsonify({'error': 'Error updating home'}), 422

# # DELETE /homes/<id>
# @homes_bp.route('/<int:home_id>', methods=['DELETE'])
# def destroy(home_id):
#     home = Home.query.get_or_404(home_id)
#     try:
#         db.session.delete(home)
#         db.session.commit()
#         return jsonify({'message': 'Home successfully deleted'}), 200
#     except:
#         db.session.rollback()
#         return jsonify({'errors': ['Failed to delete home']}), 422

@homes_bp.route('/mass_destroy', methods=['DELETE'])
def mass_destroy():
    data = request.get_json()
    ids = data.get('ids', [])
    if not ids:
        return jsonify({'error': 'No IDs provided'}), 400

    # Format the array safely.
    # This is safe because we will bind it using psql
    formatted_ids = "{" + ",".join(str(i) for i in ids) + "}"

    conn = db.engine.raw_connection()
    cur = conn.cursor()

    try:
        # Prepare all the statements once
        prepare_statement(conn, 'delete_offers_by_home_ids', """
            PREPARE delete_offers_by_home_ids(integer[]) AS
            DELETE FROM offers
            WHERE listing_id IN (
                SELECT id FROM listings WHERE home_id = ANY($1)
            );
        """)

        prepare_statement(conn, 'delete_agent_listings_by_home_ids', """
            PREPARE delete_agent_listings_by_home_ids(integer[]) AS
            DELETE FROM agent_listings
            WHERE listing_id IN (
                SELECT id FROM listings WHERE home_id = ANY($1)
            );
        """)

        prepare_statement(conn, 'delete_listings_by_home_ids', """
            PREPARE delete_listings_by_home_ids(integer[]) AS
            DELETE FROM listings
            WHERE home_id = ANY($1);
        """)

        prepare_statement(conn, 'delete_homes_by_ids', """
            PREPARE delete_homes_by_ids(integer[]) AS
            DELETE FROM homes
            WHERE id = ANY($1);
        """)

        # Execute each one in order
        cur.execute("EXECUTE delete_offers_by_home_ids(%s::integer[])", (formatted_ids,))
        cur.execute("EXECUTE delete_agent_listings_by_home_ids(%s::integer[])", (formatted_ids,))
        cur.execute("EXECUTE delete_listings_by_home_ids(%s::integer[])", (formatted_ids,))
        cur.execute("EXECUTE delete_homes_by_ids(%s::integer[])", (formatted_ids,))

        conn.commit()
        return jsonify({'message': f'Homes {ids} successfully deleted'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 422

    finally:
        cur.close()
        conn.close()
