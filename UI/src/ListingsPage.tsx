import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ListingsPage() {
  const [cityFilter, setCityFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("");
  const [bathFilter, setBathFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [maxHoa, setMaxHoa] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [reportMode, setReportMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const resetFilters = () => {
    setCityFilter("");
    setBedFilter("");
    setBathFilter("");
    setYearFilter("");
    setMaxHoa("");
    setMinPrice("");
    setMaxPrice("");
    setSubFilter("");
    setAgentFilter("");
    setReportMode(false);
  }

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (reportMode) {
      if (cityFilter) params.append("city", cityFilter);
      if (bedFilter) params.append("beds", bedFilter);
      if (bathFilter) params.append("baths", bathFilter);
      if (minPrice) params.append("minPrice", minPrice);
      if (yearFilter) params.append("year", yearFilter);
      if (maxHoa) params.append("hoa", maxHoa)
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (subFilter) params.append("subdivision", subFilter);
      if (agentFilter) params.append("agent", agentFilter);
      params.append("report", "true");
    } else {
      params.append("report", "false");
    }
    return params.toString();
  };

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["listings", reportMode],
    queryFn: () =>
      axios
        .get(`http://localhost:5001/listings?${buildQueryParams()}`)
        .then((res) => res.data),
  });

  const { data: subdivisions = [] } = useQuery({
    queryKey: ["subdivisions"],
    queryFn: () =>
      axios.get("http://localhost:5001/subdivisions").then((res) => res.data),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () =>
      axios.get("http://localhost:5001/agents").then((res) => res.data),
  });

  const { data: homes = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: (searchText) =>
      axios.get(`http://localhost:5001/homes${searchText && '?' + searchText}`).then((res) => res.data),
  });

  const applyFilter = () => {
    setReportMode(true);
    refetch();
  };

  const navigate = useNavigate();

  if (modalOpen) return <CreateListingModal onClose={() => setModalOpen(false)} isOpen={modalOpen} agents={agents}/>;

  return (
    <div className="w-full mx-auto">
      <h1 className="text-2xl font-bold mb-4">Listings</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="City"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="border p-1 rounded-md"
        />
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="border p-1 rounded-md"
        />
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="border p-1 rounded-md"
        />
        <input
          type="number"
          placeholder="Year built on or after"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="border p-1 rounded-md"
        />
        <input
          type="number"
          placeholder="Max HOA fee"
          value={maxHoa}
          onChange={(e) => setMaxHoa(e.target.value)}
          className="border p-1 rounded-md"
        />
        <select
          value={bedFilter}
          onChange={(e) => setBedFilter(e.target.value)}
          className="border p-1 rounded-md"
        >
          <option value="">All Beds</option>
          <option value="1">1 Bed</option>
          <option value="2">2 Beds</option>
          <option value="3">3 Beds</option>
          <option value="4">4 Beds</option>
          <option value="5">5+ Beds</option>
        </select>
        <select
          value={bathFilter}
          onChange={(e) => setBathFilter(e.target.value)}
          className="border p-1 rounded-md"
        >
          <option value="">All Baths</option>
          <option value="1">1 Baths</option>
          <option value="2">2 Baths</option>
          <option value="3">3 Baths</option>
          <option value="4">4 Baths</option>
          <option value="5">5+ Baths</option>
        </select>
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="border p-1 rounded-md"
        >
          <option value="">All subdivisions</option>
          {subdivisions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="border p-1 rounded-md"
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          onClick={applyFilter}
          className="bg-blue-600 text-white px-4 py-1 rounded-md"
        >
          Apply filter
        </button>
        <button
          onClick={resetFilters}
          className="bg-red-600 text-white px-4 py-1 rounded-md"
        >
          Reset filters
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-500 text-white px-4 py-1 rounded-md"
        >
          New listing
        </button>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-scroll">
        {isLoading || isFetching ? (
          <p>Loading listings...</p>
        ) : error ? (
          <p className="text-red-600">Error loading data</p>
        ) : data.listings ? (
          <table className="min-w-full bg-white border border-gray-200 shadow-md">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Price ($)</th>
                <th className="p-2 border">Street</th>
                <th className="p-2 border">City</th>
                <th className="p-2 border">ZIP</th>
                <th className="p-2 border">Beds</th>
                <th className="p-2 border">Baths</th>
                <th className="p-2 border">Sqft</th>
                <th className="p-2 border">Build Year</th>
                <th className="p-2 border">Subdivision</th>
                <th className="p-2 border">HOA Fees ($)</th>
                <th className="p-2 border">Agents</th>
                <th className="p-2 border">Offers</th>
                <th className="p-2 border"></th>
              </tr>
            </thead>
            <tbody>
              {data.listings.map((listing) => {
                const subdivision = listing.home?.subdivision;
                const offers = listing.offers;

                return (
                  <tr key={listing.id} className="text-center text-sm">
                    <td className="p-2 border">{listing.id}</td>
                    <td className="p-2 border">
                      ${listing.price.toLocaleString()}
                    </td>
                    <td className="p-2 border">
                      {listing.home?.street || "N/A"}
                    </td>
                    <td className="p-2 border">
                      {listing.home?.city || "N/A"}
                    </td>
                    <td className="p-2 border">{listing.home?.zip || "N/A"}</td>
                    <td className="p-2 border">
                      {listing.home?.beds || "N/A"}
                    </td>
                    <td className="p-2 border">
                      {listing.home?.baths || "N/A"}
                    </td>
                    <td className="p-2 border">
                      {listing.home?.sqft?.toLocaleString() || "N/A"}
                    </td>
                    <td className="p-2 border">
                      {listing.home?.build_year || "N/A"}
                    </td>
                    <td className="p-2 border">{subdivision?.name || "N/A"}</td>
                    <td className="p-2 border">
                      {subdivision?.hoa_fee ? `$${subdivision.hoa_fee}` : "N/A"}
                    </td>
                    <td className="p-2 border">
                      {listing.agents.length > 0 ? (
                        <ul className="list-none text-xs">
                          {listing.agents.map((agent) => (
                            <li key={agent.id}>
                              {agent.name} -{" "}
                              <a
                                href={`mailto:${agent.email}`}
                                className="text-blue-500 underline"
                              >
                                {agent.email}
                              </a>{" "}
                              ({agent.phone_number})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "No Agents"
                      )}
                    </td>
                    <td className="p-2 border">
                      {offers.length > 0 ? (
                        <ul className="list-none text-xs">
                          {offers
                            .sort((a, b) => {
                              if (a.status === "accepted") return -2;
                              else if (a.status === "pending") return -1;
                              else return 0;
                            })
                            .sort((a, b) => b.price - a.price)
                            .map((offer) => (
                              <li key={offer.id}>
                                <span className="font-bold">
                                  ${offer.price.toLocaleString()}
                                </span>{" "}
                                - {offer.status}
                              </li>
                            ))}
                        </ul>
                      ) : (
                        "No Offers"
                      )}
                    </td>
                    <td className="p-2 border">
                      <button onClick={() => navigate(`${listing.id}`)}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="size-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No listings found</p>
        )}
      </div>
      {/* Summary Card Placeholder */}
      {data?.stats && (
        <div className="mt-6 p-4 border rounded shadow bg-white">
          {/* You can build your summary or stat card UI here */}
          <p>Total records: {data.stats.total}</p>
          <p>Average price: ${data.stats.avg_price}</p>
          <p>Average beds: {data.stats.avg_beds}</p>
          <p>Average baths: {data.stats.avg_baths}</p>
          <p>Average sqft: {data.stats.avg_sqft}</p>
        </div>
      )}
    </div>
  );
}

const CreateListingModal = ({ isOpen, onClose, onListingCreated, agents }) => {
  const [price, setPrice] = useState("");
  const [selectedHome, setSelectedHome] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [searchText, setSearchText] = useState(""); // Search term for homes

  const queryClient = useQueryClient();

  const { data: homes = [] } = useQuery({
    queryKey: ["homes", searchText],
    queryFn: () =>
      axios
        .get(`http://localhost:5001/homes?searchText=${searchText}`)
        .then((res) => res.data),
  });

  const createListingMutation = useMutation({
    mutationFn: (newListing) =>
      axios.post("http://localhost:5001/listings/", newListing).catch(e => console.log(e.request)),
    onSuccess: () => {
      onClose(); // Close the modal on success
      queryClient.invalidateQueries(['listings']);
    },
    onError: (error) => {
      console.error("Error creating listing:", error.message);
    },
  });

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleCreateListing = () => {
    const newListing = {
      price,
      home: selectedHome,
      agents: selectedAgents,
    };
    createListingMutation.mutate(newListing);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4">Create New Listing</h2>

        {/* Price Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Home Search and Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Search Homes
          </label>
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search for a home"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
          <select
            value={selectedHome}
            onChange={(e) => setSelectedHome(e.target.value)}
            className="mt-2 block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a home</option>
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.street}, {home.city}
              </option>
            ))}
          </select>
        </div>

        {/* Multiple Agents Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Select Agents
          </label>
          <select
            multiple
            value={selectedAgents}
            onChange={(e) =>
              setSelectedAgents(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="mt-4 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateListing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
            disabled={createListingMutation.isLoading}
          >
            {createListingMutation.isLoading ? "Creating..." : "Create Listing"}
          </button>
        </div>
      </div>
    </div>
  );
};
