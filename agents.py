from prepared_statements import prepare_statement
from flask import Blueprint, jsonify, request, abort
from models import db, Agent

agents_bp = Blueprint('agents', __name__, url_prefix='/agents')

# GET /agents
@agents_bp.route('/', methods=['GET'])
def index():
    agents = []
    if request.args.get('listing'):
        conn = db.engine.raw_connection()
        cur = conn.cursor()
        prepare_statement(conn, 'get_agents_not_on_listing', """
            PREPARE get_agents_not_on_listing(integer) AS
            SELECT id 
            FROM agents 
            WHERE id NOT IN (
                SELECT a.id AS id
                FROM agent_listings al
                JOIN agents a ON al.agent_id = a.id
                JOIN listings l ON al.listing_id = l.id
                WHERE l.id = $1
            );
        """)
        cur.execute("EXECUTE get_agents_not_on_listing(%s)", (request.args.get('listing'),))
        ids = [row[0] for row in cur.fetchall()]
        agents = Agent.query.filter(Agent.id.in_(ids)).all()
        cur.close()
        conn.close()
    else:
        agents = Agent.query.all()
    return jsonify([{
        'id': a.id,
        'name': a.name,
        'email': a.email,
        'phone_number': a.phone_number
    } for a in agents]), 200

# # GET /agents/<id>
# @agents_bp.route('/<int:agent_id>', methods=['GET'])
# def show(agent_id):
#     agent = Agent.query.get_or_404(agent_id)
#     return jsonify({
#         'id': agent.id,
#         'name': agent.name,
#         'email': agent.email,
#         'phone_number': agent.phone_number
#     }), 200

# # POST /agents
# @agents_bp.route('/', methods=['POST'])
# def create():
#     data = request.get_json()
#     agent = Agent(
#         name=data.get('name'),
#         email=data.get('email'),
#         phone_number=data.get('phone_number')
#     )
#     try:
#         db.session.add(agent)
#         db.session.commit()
#         return jsonify({
#             'id': agent.id,
#             'name': agent.name,
#             'email': agent.email,
#             'phone_number': agent.phone_number
#         }), 201
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'error': str(e)}), 422

# # PATCH/PUT /agents/<id>
# @agents_bp.route('/<int:agent_id>', methods=['PUT', 'PATCH'])
# def update(agent_id):
#     agent = Agent.query.get_or_404(agent_id)
#     data = request.get_json()

#     agent.name = data.get('name', agent.name)
#     agent.email = data.get('email', agent.email)
#     agent.phone_number = data.get('phone_number', agent.phone_number)

#     try:
#         db.session.commit()
#         return jsonify({
#             'id': agent.id,
#             'name': agent.name,
#             'email': agent.email,
#             'phone_number': agent.phone_number
#         }), 200
#     except:
#         db.session.rollback()
#         return jsonify({'error': 'Error updating agent'}), 422

# # DELETE /agents/<id>
# @agents_bp.route('/<int:agent_id>', methods=['DELETE'])
# def destroy(agent_id):
#     agent = Agent.query.get_or_404(agent_id)
#     try:
#         db.session.delete(agent)
#         db.session.commit()
#         return jsonify({'message': 'Agent successfully deleted'}), 200
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'errors': [str(e)]}), 422
