from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Home(db.Model):
    __tablename__ = "homes"
    id = db.Column(db.Integer, primary_key=True)
    street = db.Column(db.String)
    city = db.Column(db.String)
    zip = db.Column(db.String)
    beds = db.Column(db.Integer)
    baths = db.Column(db.Integer)
    sqft = db.Column(db.Integer)
    build_year = db.Column(db.Integer)
    subdivision_id = db.Column(db.Integer, db.ForeignKey("subdivisions.id"))
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    listings = db.relationship("Listing", backref="home", lazy=True)

class Agent(db.Model):
    __tablename__ = "agents"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    email = db.Column(db.String)
    phone_number = db.Column(db.String)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    listings = db.relationship("AgentListing", backref="agent", lazy=True)


class Listing(db.Model):
    __tablename__ = "listings"
    id = db.Column(db.Integer, primary_key=True)
    price = db.Column(db.Integer)
    home_id = db.Column(db.Integer, db.ForeignKey("homes.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    agent_links = db.relationship("AgentListing", backref="listing", lazy=True)
    offers = db.relationship("Offer", backref="listing", lazy=True)

class AgentListing(db.Model):
    __tablename__ = "agent_listings"
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey("agents.id"), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

class Offer(db.Model):
    __tablename__ = "offers"
    id = db.Column(db.Integer, primary_key=True)
    price = db.Column(db.Integer)
    status = db.Column(db.String)
    name = db.Column(db.String)
    email = db.Column(db.String)
    phone_number = db.Column(db.String)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

class Subdivision(db.Model):
    __tablename__ = "subdivisions"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    hoa_fee = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    homes = db.relationship("Home", backref="subdivision", lazy=True)

# class Buyer(db.Model):
#     __tablename__ = "buyers"
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String)
#     email = db.Column(db.String)
#     phone_number = db.Column(db.String)
#     created_at = db.Column(db.DateTime, nullable=False)
#     updated_at = db.Column(db.DateTime, nullable=False)

    # offers = db.relationship("Offer", backref="buyer", lazy=True)








