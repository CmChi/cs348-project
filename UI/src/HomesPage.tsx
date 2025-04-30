import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

export default function HomesPage() {
  const queryClient = useQueryClient();
  const [selectedHomes, setSelectedHomes] = useState([]);
  const [localEdits, setLocalEdits] = useState({});
  const [focusedField, setFocusedField] = useState({});
  const [newHome, setNewHome] = useState({
    street: "",
    city: "",
    zip: "",
    beds: "",
    baths: "",
    sqft: "",
    build_year: "",
    subdivision_id: "",
  });

  const {
    data: homes = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["homes"],
    queryFn: () =>
      axios.get("http://localhost:5001/homes").then((res) => res.data),
  });

  const { data: subdivisions = [] } = useQuery({
    queryKey: ["subdivisions"],
    queryFn: () =>
      axios.get("http://localhost:5001/subdivisions").then((res) => res.data),
  });

  const updateHome = useMutation({
    mutationFn: (updatedData) =>
      axios.patch(`http://localhost:5001/homes/${updatedData.id}`, {
        home: updatedData,
      }),
    onSuccess: () => queryClient.invalidateQueries(["homes"]),
  });

  const deleteHomes = useMutation({
    mutationFn: (ids) =>
      axios.delete("http://localhost:5001/homes/mass_destroy", {
        data: { ids },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["homes"]);
      setSelectedHomes([]);
    },
  });

  const createHome = useMutation({
    mutationFn: (newHome) =>
      axios.post("http://localhost:5001/homes/", newHome),
    onSuccess: () => {
      queryClient.invalidateQueries(["homes"]);
      setNewHome({
        street: "",
        city: "",
        zip: "",
        beds: "",
        baths: "",
        sqft: "",
        build_year: "",
        subdivision_id: "",
      });
    },
  });

  const handleChange = (e, id, field) => {
    setLocalEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], id, [field]: e.target.value },
    }));
  };

  const handleBlur = (id) => {
    if (localEdits[id]) {
      updateHome.mutate(localEdits[id]);
      setLocalEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[id];
        return newEdits;
      });
    }
    setFocusedField({});
  };

  const handleSubdivisionChange = (id, value) => {
    updateHome.mutate({ id, subdivision_id: value });
  };

  const toggleSelection = (id) => {
    setSelectedHomes((prev) =>
      prev.includes(id) ? prev.filter((hid) => hid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedHomes.length) deleteHomes.mutate(selectedHomes);
  };

  const handleNewHomeChange = (field, value) => {
    setNewHome((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateHome = () => {
    if (!newHome.street || !newHome.city) return;
    createHome.mutate(newHome);
  };

  if (isLoading) return <p>Loading homes...</p>;
  if (error) return <p>Error loading data.</p>;

  const fields = [
    "street",
    "city",
    "zip",
    "beds",
    "baths",
    "sqft",
    "build_year",
  ];

  return (
    <div className="w-full px-2 py-4">
      <h1 className="text-2xl font-bold mb-3">Homes</h1>

      {/* New Home Form */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Add New Home</h2>
        <div className="flex flex-wrap gap-2">
          {fields.map((field) => (
            <input
              key={field}
              type="text"
              placeholder={field.replace("_", " ")}
              value={newHome[field]}
              onChange={(e) => handleNewHomeChange(field, e.target.value)}
              className="border px-2 py-1 text-sm rounded w-[140px]"
            />
          ))}
          <select
            value={newHome.subdivision_id}
            onChange={(e) =>
              handleNewHomeChange("subdivision_id", e.target.value)
            }
            className="border px-2 py-1 text-sm rounded w-[160px]"
          >
            <option value="">No Subdivision</option>
            {subdivisions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateHome}
            className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm"
          >
            Add Home
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
        <button
          onClick={handleDeleteSelected}
          disabled={selectedHomes.length === 0}
          className={`px-4 py-2 rounded ${
            selectedHomes.length > 0
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Delete Selected
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-2 border">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelectedHomes(
                      e.target.checked ? homes.map((home) => home.id) : []
                    )
                  }
                  checked={selectedHomes.length === homes.length}
                />
              </th>
              {fields.map((f) => (
                <th key={f} className="p-2 border capitalize">
                  {f.replace("_", " ")}
                </th>
              ))}
              <th className="p-2 border">Subdivision</th>
              <th className="p-2 border">HOA</th>
            </tr>
          </thead>
          <tbody>
            {homes.map((home) => {
              const subdivision = subdivisions.find(
                (s) => s.id === home.subdivision_id
              );

              return (
                <tr key={home.id} className="text-sm text-center">
                  <td className="border p-1">
                    <input
                      type="checkbox"
                      checked={selectedHomes.includes(home.id)}
                      onChange={() => toggleSelection(home.id)}
                    />
                  </td>
                  {fields.map((field) => (
                    <td
                      key={field}
                      className={`border p-0 ${
                        focusedField.id === home.id &&
                        focusedField.field === field
                          ? "bg-yellow-100"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={
                          localEdits[home.id]?.[field] ?? home[field] ?? ""
                        }
                        onChange={(e) => handleChange(e, home.id, field)}
                        onFocus={() => setFocusedField({ id: home.id, field })}
                        onBlur={() => handleBlur(home.id)}
                        className="w-full h-full bg-transparent text-center outline-none px-1"
                      />
                    </td>
                  ))}
                  <td className="border">
                    <select
                      value={
                        localEdits[home.id]?.subdivision_id ??
                        home.subdivision_id ??
                        ""
                      }
                      onChange={(e) =>
                        handleSubdivisionChange(home.id, e.target.value)
                      }
                      className="w-full bg-white px-1 py-0.5"
                    >
                      <option value="">None</option>
                      {subdivisions.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border text-stone-500">
                    {subdivision ? `$${subdivision.hoa_fee.toFixed(2)}` : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
