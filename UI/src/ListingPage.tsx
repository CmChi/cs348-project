import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

export default function ListingPage() {
  const { id } = useParams(); // Get the listing ID from the URL
  const queryClient = useQueryClient();

  const [addAgent, setAddAgent] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerStatus, setOfferStatus] = useState("pending");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhoneNumber, setBuyerPhoneNumber] = useState("");

  // Fetch the listing data using react-query
  const { data, error, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () =>
      axios.get(`http://localhost:5001/listings/${id}`).then((r) => r.data),
    enabled: !!id, // Ensures the query runs only when ID is available
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () =>
      axios
        .get(`http://localhost:5001/agents?listing=${id}`)
        .then((res) => res.data),
  });

  const toggleAgentMutation = useMutation({
    mutationFn: (agent_id) =>
      axios
        .patch(`http://localhost:5001/listings/toggle/${id}/${agent_id}`)
        .catch((e) => console.log(e.request)),
    onSuccess: () => {
      queryClient.invalidateQueries(["listing", id]);
    },
    onError: (error) => {
      console.error("Error creating listing:", error.message);
    },
  });

  const addressOfferMutation = useMutation({
    mutationFn: (args) =>
      axios.patch(
        `http://localhost:5001/offers/address/${args.id}?action=${args.action}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["listing", id]);
    },
    onError: (error) => {
      console.error("Error addressing offer:", error.message);
    },
  });

  // New mutation for creating offers
  const createOfferMutation = useMutation({
    mutationFn: () =>
      axios.post(`http://localhost:5001/offers/`, {
        price: offerPrice,
        status: offerStatus,
        name: buyerName,
        email: buyerEmail,
        phone_number: buyerPhoneNumber,
        listing_id: id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["listing", id]);
      // Reset the form after submission
      setOfferPrice("");
      setOfferStatus("pending");
      setBuyerName("");
      setBuyerEmail("");
      setBuyerPhoneNumber("");
    },
    onError: (error) => {
      console.error("Error creating offer:", error.message);
    },
  });

  if (isLoading) {
    return <p className="text-center text-lg text-gray-500">Loading...</p>;
  }

  if (error) {
    return (
      <p className="text-center text-red-600 text-lg">
        Error loading listing details
      </p>
    );
  }

  const handleAddAgent = () => {
    if (addAgent) {
      toggleAgentMutation.mutate(addAgent);
      setAddAgent("");
    }
  };

  const handleCreateOffer = (e) => {
    e.preventDefault();
    createOfferMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Listing {data.id}
      </h1>

      {/* Property Details Section */}
      <div className="mb-8 border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          Property Details
        </h2>
        <div className="space-y-3 mt-4">
          <p className="text-lg">
            <strong className="text-gray-600">Price:</strong> $
            {data.price.toLocaleString()}
          </p>
          <p className="text-lg">
            <strong className="text-gray-600">City:</strong> {data.home.city}
          </p>
          <p className="text-lg">
            <strong className="text-gray-600">ZIP Code:</strong> {data.home.zip}
          </p>
          <p className="text-lg">
            <strong className="text-gray-600">Beds:</strong> {data.home.beds}
          </p>
          <p className="text-lg">
            <strong className="text-gray-600">Baths:</strong> {data.home.baths}
          </p>
          <p className="text-lg">
            <strong className="text-gray-600">Square Footage:</strong>{" "}
            {data.home.sqft} sqft
          </p>
        </div>
      </div>

      {/* Agent Information Section */}
      <div className="mb-8 border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          Agent Information
        </h2>

        {/* Add Agent Dropdown */}
        <div className="flex items-center mb-4">
          <select
            value={addAgent}
            onChange={(e) => setAddAgent(e.target.value)}
            className="border p-2 rounded-md mr-4"
          >
            <option value="">Select an Agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddAgent}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Add Agent
          </button>
        </div>

        {/* List of Current Agents */}
        <ul className="space-y-4 mt-4">
          {data.agents.map((agent) => (
            <li key={agent.id} className="bg-gray-100 p-4 rounded-lg shadow-sm">
              <p className="font-medium text-lg text-gray-800">{agent.name}</p>
              <p className="text-sm text-gray-600">
                <a
                  href={`mailto:${agent.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {agent.email}
                </a>{" "}
                | {agent.phone_number}
              </p>
              {/* Delete Agent Button */}
              <button
                onClick={() => toggleAgentMutation.mutate(agent.id)}
                className="mt-2 text-red-600 hover:text-red-800"
              >
                Delete Agent
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Offer Creation Form */}
      <div className="mb-8 border-b pb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Create Offer</h2>

        <form onSubmit={handleCreateOffer} className="space-y-4 mt-4">
          <div>
            <label htmlFor="offerPrice" className="block text-sm text-gray-600">
              Price
            </label>
            <input
              type="number"
              id="offerPrice"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label
              htmlFor="offerStatus"
              className="block text-sm text-gray-600"
            >
              Status
            </label>
            <select
              id="offerStatus"
              value={offerStatus}
              onChange={(e) => setOfferStatus(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label htmlFor="buyerName" className="block text-sm text-gray-600">
              Buyer Name
            </label>
            <input
              type="text"
              id="buyerName"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="buyerEmail" className="block text-sm text-gray-600">
              Buyer Email
            </label>
            <input
              type="email"
              id="buyerEmail"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label
              htmlFor="buyerPhoneNumber"
              className="block text-sm text-gray-600"
            >
              Buyer Phone Number
            </label>
            <input
              type="tel"
              id="buyerPhoneNumber"
              value={buyerPhoneNumber}
              onChange={(e) => setBuyerPhoneNumber(e.target.value)}
              className="w-full p-2 border rounded-md"
              pattern="^\+?(\d{1,2}\s?)?(\(\d{3}\)|\d{3})([\s\-\.]?)\d{3}([\s\-\.]?)\d{4}$"
              required
              inputMode="tel"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Create Offer
          </button>
        </form>
      </div>

      {/* Offers Section */}
      {data.offers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Offers</h2>
          <ul className="space-y-4 mt-4">
            {data.offers
              .sort((a, b) => b.price - a.price) // Sorting offers by price (highest first)
              .map((offer) => (
                <li
                  key={offer.id}
                  className="bg-gray-100 p-4 rounded-lg shadow-sm"
                >
                  <p className="font-medium text-lg text-gray-800">
                    ${offer.price.toLocaleString()} -{" "}
                    <span className="text-sm">{offer.status}</span>
                  </p>
                  {/* Buyer info directly on the offer */}
                  <div className="mt-2">
                    <p className="font-medium text-gray-700">
                      <strong>Buyer:</strong> {offer.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <a
                        href={`mailto:${offer.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {offer.email}
                      </a>{" "}
                      | {offer.phone_number}
                    </p>
                  </div>

                  {/* Accept/Decline Buttons */}
                  {offer.status === "pending" && (
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          addressOfferMutation.mutate({
                            id: offer.id,
                            action: "accept",
                          })
                        }
                        className="bg-green-600 text-white px-4 py-1 rounded-md mr-2"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          addressOfferMutation.mutate({
                            id: offer.id,
                            action: "reject",
                          })
                        }
                        className="bg-red-600 text-white px-4 py-1 rounded-md"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* If no offers or agents */}
      {data.agents.length === 0 && (
        <p className="text-center text-gray-600">No Agents Available</p>
      )}
      {data.offers.length === 0 && (
        <p className="text-center text-gray-600">No Offers Available</p>
      )}
    </div>
  );
}
