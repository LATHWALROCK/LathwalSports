import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualTournament from "../components/TournamentTile";
import { tournamentEndpoints } from "../services/apis";
import { useSearchParams } from "react-router-dom";

const { GET_TOURNAMENT, CREATE_TOURNAMENT } = tournamentEndpoints;

function Tournament() {
  const [searchParams] = useSearchParams();
  const sport = searchParams.get("sport");
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({ name: "", type: "" });
  const [image, setImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { name, type } = formData;

  const fetchData = async () => {
    try {
      const response = await apiConnector("GET", GET_TOURNAMENT, null, null, {
        sport: sport,
      });
      setData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch tournaments");
      console.error("FETCH TOURNAMENTS ERROR:", error);
    }
  };

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating tournament...");

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", name);
      formDataObj.append("sport", sport);
      formDataObj.append("image", image);
      formDataObj.append("type", type);

      const response = await apiConnector("POST", CREATE_TOURNAMENT, formDataObj, {
        "Content-Type": "multipart/form-data",
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Tournament created successfully");
      setFormData({ name: "", type: "" });
      setImage(false);
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("CREATE TOURNAMENT ERROR:", error);
      toast.error("Tournament creation failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Group tournaments by type
  const groupedData = data.reduce((groups, tournament) => {
    if (!groups[tournament.type]) groups[tournament.type] = [];
    groups[tournament.type].push(tournament);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Tournaments for {sport}
        </h1>

        {/* Render grouped tournaments */}
        {Object.keys(groupedData).map((type) => (
          <div key={type} className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              {type}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {groupedData[type].map((tournament) => (
                <li key={tournament._id}>
                  <IndividualTournament
                    title={tournament.name}
                    image={tournament.imageUrl}
                    sport={sport}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Add Tournament button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
            text-2xl font-bold text-gray-700 hover:shadow-xl hover:scale-[1.02] 
            transition-all duration-300 cursor-pointer"
          >
            + Add Tournament
          </button>
        ) : (
          <form
            onSubmit={handleOnSubmit}
            className="w-full bg-white shadow-md rounded-2xl p-6 flex flex-col items-center 
            justify-center gap-4 transition-all duration-300"
          >
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleOnChange}
              placeholder="Enter tournament name"
              className="w-full border border-gray-300 rounded-lg p-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              name="type"
              value={type}
              onChange={handleOnChange}
              placeholder="Enter tournament type"
              className="w-full border border-gray-300 rounded-lg p-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="border border-green-600 bg-green-500 px-4 py-2 rounded-lg 
                hover:bg-green-600 hover:border-green-700 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-500 bg-gray-400 px-4 py-2 rounded-lg 
                hover:bg-gray-500 hover:border-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Tournament;
