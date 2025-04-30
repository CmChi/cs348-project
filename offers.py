import datetime
from flask import Blueprint, request, jsonify
from models import db, Offer
from sqlalchemy.exc import SQLAlchemyError

offers_bp = Blueprint('offers', __name__, url_prefix='/offers')

# # GET /offers
# @offers_bp.route('/', methods=['GET'])
# def index():
#     offers = Offer.query.all()
#     return jsonify([{
#         "id": o.id,
#         "price": o.price,
#         "status": o.status,
#         "name": o.name,
#         "email": o.email,
#         "phone_number": o.phone_number,
#         "listing_id": o.listing_id,
#         "created_at": o.created_at.isoformat(),
#         "updated_at": o.updated_at.isoformat()
#     } for o in offers]), 200

# # GET /offers/<id>
# @offers_bp.route('/<int:offer_id>', methods=['GET'])
# def show(offer_id):
#     offer = Offer.query.get_or_404(offer_id)
#     return jsonify({
#         "id": offer.id,
#         "price": offer.price,
#         "status": offer.status,
#         "name": offer.name,
#         "email": offer.email,
#         "phone_number": offer.phone_number,
#         "listing_id": offer.listing_id,
#         "created_at": offer.created_at.isoformat(),
#         "updated_at": offer.updated_at.isoformat()
#     }), 200

# POST /offers
@offers_bp.route('/', methods=['POST'])
def create():
    data = request.get_json()
    offer = Offer(
        price=data.get('price'),
        status=data.get('status'),
        name=data.get('name'),
        email=data.get('email'),
        phone_number=data.get('phone_number'),
        listing_id=data.get('listing_id'),
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now()
    )
    try:
        db.session.add(offer)
        db.session.commit()
        return jsonify({
            "id": offer.id,
            "price": offer.price,
            "status": offer.status,
            "name": offer.name,
            "email": offer.email,
            "phone_number": offer.phone_number,
            "listing_id": offer.listing_id,
            "created_at": offer.created_at.isoformat(),
            "updated_at": offer.updated_at.isoformat()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 422

# # PUT/PATCH /offers/<id>
# @offers_bp.route('/<int:offer_id>', methods=['PUT', 'PATCH'])
# def update(offer_id):
#     offer = Offer.query.get_or_404(offer_id)
#     data = request.get_json()
#     offer.price = data.get('price', offer.price)
#     offer.status = data.get('status', offer.status)

#     try:
#         db.session.commit()
#         return jsonify({
#             "id": offer.id,
#             "price": offer.price,
#             "status": offer.status,
#             "name": offer.name,
#             "email": offer.email,
#             "phone_number": offer.phone_number,
#             "listing_id": offer.listing_id,
#             "created_at": offer.created_at.isoformat(),
#             "updated_at": offer.updated_at.isoformat()
#         }), 200
#     except:
#         db.session.rollback()
#         return jsonify({'error': 'Error updating offer'}), 422

# # DELETE /offers/<id>
# @offers_bp.route('/<int:offer_id>', methods=['DELETE'])
# def destroy(offer_id):
#     offer = Offer.query.get_or_404(offer_id)
#     try:
#         db.session.delete(offer)
#         db.session.commit()
#         return jsonify({'message': 'Offer successfully deleted'}), 200
#     except:
#         db.session.rollback()
#         return jsonify({'errors': ['Failed to delete offer']}), 422

@offers_bp.route('/address/<int:offer_id>', methods=['PATCH', 'PUT'])
def addressOffer(offer_id):
    print('------')
    offer = Offer.query.get(offer_id)
    print(request.args.get('action'))
    try:
        if request.args.get('action') == 'accept':
            offer.status = 'accepted'
        else:
            offer.status = 'rejected'
        db.session.commit()
        return jsonify({'message': 'offer addressed'}), 200
    except:
        db.session.rollback()
        return jsonify({'errors': ['Failed to address offer']}), 422