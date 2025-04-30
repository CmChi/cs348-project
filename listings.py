import datetime
from flask import Blueprint, request, jsonify
from models import db, Listing, Home, Subdivision, Agent, Offer, AgentListing
from sqlalchemy.exc import SQLAlchemyError
from prepared_statements import prepare_statement

listings_bp = Blueprint('listings', __name__, url_prefix='/listings')

# GET /listings
@listings_bp.route('/', methods=['GET'])
def index():
    args = request.args
    listings = []

    conn = db.engine.raw_connection()
    cur = conn.cursor()

    # We will use a prepared statement to efficiently filter listings
    # that we want to include in our report.
    prepare_statement(conn, 'filter_listing_ids', """
        PREPARE filter_listing_ids(integer, integer, integer, integer, integer, integer, integer, integer, text) AS
        SELECT l.id
        FROM listings l
        JOIN homes h ON l.home_id = h.id
        LEFT JOIN subdivisions s ON s.id = h.subdivision_id
        WHERE 
        ($1 IS NULL OR l.price <= $1) AND
        ($2 IS NULL OR l.price >= $2) AND
        (
            $3 IS NULL OR
            (h.beds = $3 AND $3 < 5) OR
            (h.beds >= $3 AND $3 = 5)
        ) AND
        (
            $4 IS NULL OR
            (h.baths = $4 AND $4 < 5) OR
            (h.baths >= $4 AND $4 = 5)
        ) AND             
        ($5 IS NULL OR subdivision_id = $5)
        AND ($6 IS NULL OR $6 IN (SELECT agent_id FROM agent_listings WHERE listing_id = l.id))
        AND ($7 IS NULL OR h.build_year >= $7)
        AND ($8 IS NULL OR s.hoa_fee <= $8 OR s.hoa_fee IS NULL)
        AND ($9 IS NULL OR $9 ILIKE h.city)
        ORDER BY l.price ASC;
    """)
    cur.execute("EXECUTE filter_listing_ids(%s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                (args.get('maxPrice'), 
                    args.get('minPrice'),
                    args.get('beds'),
                    args.get('baths'),
                    args.get('subdivision'),
                    args.get('agent'),
                    args.get('year'),
                    args.get('hoa'),
                    args.get('city')))
    ids = [row[0] for row in cur.fetchall()] # Get the filtered ids
    listings = Listing.query.filter(Listing.id.in_(ids)).all()

    response = {}
    response['listings'] = []
    response['stats'] = []

    prepare_statement(conn, 'fetch_listing_stats', """
        PREPARE fetch_listing_stats(integer[]) AS
        SELECT 
            COUNT(*) AS total,
            ROUND(AVG(l.price), 2) AS avg_price,
            ROUND(AVG(h.beds), 2) AS avg_beds,
            ROUND(AVG(h.baths), 2) AS avg_baths,
            ROUND(AVG(h.sqft), 2) AS avg_sqft,
            ROUND(MIN(l.price), 2) AS min_price,
            ROUND(MAX(l.price), 2) AS max_price
        FROM listings l
        JOIN homes h ON l.home_id = h.id
        WHERE l.id = ANY($1::integer[])
                      """)
    
    formatted_ids = "{" + ",".join(str(i) for i in ids) + "}"
    cur.execute("""
        EXECUTE fetch_listing_stats(%s);
    """, (formatted_ids,))
    response['stats'] = dict(zip([desc[0] for desc in cur.description], cur.fetchone()))

    conn.commit()
    cur.close()
    conn.close()

    for l in listings:
        home = Home.query.get(l.home_id)
        subdivision = Subdivision.query.get(home.subdivision_id) if home else None
        offers = Offer.query.filter_by(listing_id=l.id).all()
        agent_links = AgentListing.query.filter_by(listing_id=l.id).all()
        agents = [Agent.query.get(link.agent_id) for link in agent_links]

        response['listings'].append({
            "id": l.id,
            "price": l.price,
            "home": {
                "id": home.id,
                "street": home.street,
                "city": home.city,
                "zip": home.zip,
                "beds": home.beds,
                "baths": home.baths,
                "sqft": home.sqft,
                "build_year": home.build_year,
                "subdivision": {
                    "id": subdivision.id,
                    "name": subdivision.name,
                    "hoa_fee": subdivision.hoa_fee
                } if subdivision else None
            } if home else None,
            "agents": [{
                "id": a.id,
                "name": a.name,
                "email": a.email,
                "phone_number": a.phone_number
            } for a in agents if a],
            "offers": [{
                "id": o.id,
                "price": o.price,
                "status": o.status,
                "listing_id": o.listing_id
            } for o in offers]
        })

    return jsonify(response), 200

# GET /listings/<id>
@listings_bp.route('/<int:listing_id>', methods=['GET'])
def show(listing_id):
    l = Listing.query.get(listing_id)
    home = Home.query.get(l.home_id)
    subdivision = Subdivision.query.get(home.subdivision_id) if home else None
    offers = Offer.query.filter_by(listing_id=l.id).all()
    agent_links = AgentListing.query.filter_by(listing_id=l.id).all()
    agents = [Agent.query.get(link.agent_id) for link in agent_links]
    return jsonify({
        "id": l.id,
        "price": l.price,
        "home": {
            "id": home.id,
            "street": home.street,
            "city": home.city,
            "zip": home.zip,
            "beds": home.beds,
            "baths": home.baths,
            "sqft": home.sqft,
            "build_year": home.build_year,
            "subdivision": {
                "id": subdivision.id,
                "name": subdivision.name,
                "hoa_fee": subdivision.hoa_fee
            } if subdivision else None
        } if home else None,
        "agents": [{
            "id": a.id,
            "name": a.name,
            "email": a.email,
            "phone_number": a.phone_number
        } for a in agents if a],
        "offers": [{
            "id": o.id,
            "price": o.price,
            "status": o.status,
            "name": o.name,
            "email": o.email,
            "phone_number": o.phone_number, 
            "listing_id": o.listing_id
        } for o in offers]
    }), 200

# POST /listings
@listings_bp.route('/', methods=['POST'], strict_slashes=False)
def create():
    print('post')
    data = request.get_json()
    listing = Listing(
        price=data.get('price'),
        home_id=data.get('home'),
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now()
    )
    try:
        db.session.add(listing)
        db.session.commit()

        for id in data.get('agents'):
            agent_listing = AgentListing(
                listing_id=listing.id,
                agent_id=id,
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            db.session.add(agent_listing)
            db.session.commit()
        return jsonify({
            "id": listing.id,
            "price": listing.price,
            "home_id": listing.home_id,
            "created_at": listing.created_at.isoformat(),
            "updated_at": listing.updated_at.isoformat()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 422

# # PUT /listings/<id>
# @listings_bp.route('/<int:listing_id>', methods=['PUT', 'PATCH'])
# def update(listing_id):
#     listing = Listing.query.get_or_404(listing_id)
#     data = request.get_json()
#     listing.price = data.get('price', listing.price)

#     try:
#         db.session.commit()
#         return jsonify({
#             "id": listing.id,
#             "price": listing.price,
#             "home_id": listing.home_id,
#             "created_at": listing.created_at.isoformat(),
#             "updated_at": listing.updated_at.isoformat()
#         }), 200
#     except:
#         db.session.rollback()
#         return jsonify({'error': 'Error updating listing'}), 422

# # DELETE /listings/<id>
# @listings_bp.route('/<int:listing_id>', methods=['DELETE'])
# def destroy(listing_id):
#     listing = Listing.query.get_or_404(listing_id)
#     try:
#         db.session.delete(listing)
#         db.session.commit()
#         return jsonify({'message': 'Listing successfully deleted'}), 200
#     except:
#         db.session.rollback()
#         return jsonify({'errors': ['Failed to delete listing']}), 422

@listings_bp.route('toggle/<int:listing_id>/<int:agent_id>', methods=['PATCH', 'PUT'])
def toggleAgent(listing_id, agent_id):
    agent_listing = AgentListing.query.filter_by(listing_id=listing_id, agent_id=agent_id).first()
    try:
        if agent_listing:
            db.session.delete(agent_listing)
        else:
            agent_listing = AgentListing(listing_id=listing_id,
                                         agent_id=agent_id,
                                         created_at=datetime.datetime.now(),
                                         updated_at=datetime.datetime.now()
                                         )
            db.session.add(agent_listing)
        db.session.commit()
        return jsonify({'message': 'Toggle success'})
    except:
        db.session.rollback()
        return jsonify({'errors': ['Failed to delete listing']}), 422