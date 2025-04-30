from flask import Blueprint, request, jsonify
from models import db, Subdivision
from sqlalchemy.exc import SQLAlchemyError

subdivisions_bp = Blueprint('subdivisions', __name__, url_prefix='/subdivisions')

# GET /subdivisions
@subdivisions_bp.route('/', methods=['GET'])
def index():
    subdivisions = Subdivision.query.all()
    return jsonify([{
        "id": s.id,
        "name": s.name,
        "hoa_fee": s.hoa_fee,
        "created_at": s.created_at.isoformat(),
        "updated_at": s.updated_at.isoformat()
    } for s in subdivisions]), 200

# # GET /subdivisions/<id>
# @subdivisions_bp.route('/<int:subdivision_id>', methods=['GET'])
# def show(subdivision_id):
#     s = Subdivision.query.get_or_404(subdivision_id)
#     return jsonify({
#         "id": s.id,
#         "name": s.name,
#         "hoa_fee": s.hoa_fee,
#         "created_at": s.created_at.isoformat(),
#         "updated_at": s.updated_at.isoformat()
#     }), 200

# # POST /subdivisions
# @subdivisions_bp.route('/', methods=['POST'])
# def create():
#     data = request.get_json()
#     s = Subdivision(
#         name=data.get('name'),
#         hoa_fee=data.get('hoa_fee')
#     )
#     try:
#         db.session.add(s)
#         db.session.commit()
#         return jsonify({
#             "id": s.id,
#             "name": s.name,
#             "hoa_fee": s.hoa_fee,
#             "created_at": s.created_at.isoformat(),
#             "updated_at": s.updated_at.isoformat()
#         }), 201
#     except SQLAlchemyError as e:
#         db.session.rollback()
#         return jsonify({'error': str(e)}), 422

# # PUT /subdivisions/<id>
# @subdivisions_bp.route('/<int:subdivision_id>', methods=['PUT', 'PATCH'])
# def update(subdivision_id):
#     s = Subdivision.query.get_or_404(subdivision_id)
#     data = request.get_json()

#     s.name = data.get('name', s.name)
#     s.hoa_fee = data.get('hoa_fee', s.hoa_fee)

#     try:
#         db.session.commit()
#         return jsonify({
#             "id": s.id,
#             "name": s.name,
#             "hoa_fee": s.hoa_fee,
#             "created_at": s.created_at.isoformat(),
#             "updated_at": s.updated_at.isoformat()
#         }), 200
#     except:
#         db.session.rollback()
#         return jsonify({'error': 'Error updating subdivision'}), 422

# # DELETE /subdivisions/<id>
# @subdivisions_bp.route('/<int:subdivision_id>', methods=['DELETE'])
# def destroy(subdivision_id):
#     s = Subdivision.query.get_or_404(subdivision_id)
#     try:
#         db.session.delete(s)
#         db.session.commit()
#         return jsonify({'message': 'Subdivision successfully deleted'}), 200
#     except:
#         db.session.rollback()
#         return jsonify({'errors': ['Failed to delete subdivision']}), 422
