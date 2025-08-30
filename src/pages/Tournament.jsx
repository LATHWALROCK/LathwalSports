import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualTournament from "../components/TournamentTile";
import { tournamentEndpoints, sportEndpoints } from "../services/apis";

const { GET_TOURNAMENT, CREATE_TOURNAMENT, DELETE_TOURNAMENT } =
  tournamentEndpoints;
const { GET_SPORT } = sportEndpoints;

function Tournament() {
  const [data, setData] = useState([]);
  const [sportData, setSportData] = useState([]);
  const [formData, setFormData] = useState({ name: "", type: "", sport: "" });
  const [image, setImage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { name, type, sport } = formData;

  // 🔹 Toggle states for expand/collapse
  const [sportToggle, setSportToggle] = useState({});
  const [typeToggle, setTypeToggle] = useState({});

  const fetchData = () => {
    apiConnector("GET", GET_TOURNAMENT)
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        toast.error("Failed to fetch tournaments");
        console.error("FETCH TOURNAMENTS ERROR:", error);
      });
  };

  const fetchSportData = () => {
    apiConnector("GET", GET_SPORT)
      .then((response) => {
        setSportData(response.data.data);
      })
      .catch((error) => {
        toast.error("Failed to fetch sports");
        console.error("FETCH SPORTS ERROR:", error);
      });
  };

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating tournament...");

    const formDataObj = new FormData();
    formDataObj.append("name", name);
    formDataObj.append("sport", sport);
    formDataObj.append("image", image);
    formDataObj.append("type", type);

    apiConnector("POST", CREATE_TOURNAMENT, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        toast.success("Tournament created successfully");
        setFormData({ name: "", type: "", sport: "" });
        setImage(null);
        setShowForm(false);
        fetchData();
      })
      .catch((error) => {
        console.error("CREATE TOURNAMENT ERROR:", error);
        toast.error("Tournament creation failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  const handleDelete = (name, _id) => {
    const toastId = toast.loading("Deleting tournament...");

    apiConnector("DELETE", DELETE_TOURNAMENT, { name, _id })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Tournament deleted successfully");
        fetchData();
      })
      .catch((error) => {
        console.error("DELETE TOURNAMENT ERROR:", error);
        toast.error("Tournament deletion failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  useEffect(() => {
    fetchData();
    fetchSportData();
  }, []);

  // 🔹 Group tournaments first by sport, then by type
  const groupedData = data.reduce((sports, tournament) => {
    const sportName = tournament.sport?.name || "Unknown Sport";
    if (!sports[sportName]) sports[sportName] = {};

    const typeName = tournament.type || "Other";
    if (!sports[sportName][typeName]) sports[sportName][typeName] = [];

    sports[sportName][typeName].push(tournament);
    return sports;
  }, {});

  // 🔹 Toggle sport expand/collapse
  const toggleSport = (sportName) => {
    setSportToggle((prev) => ({
      ...prev,
      [sportName]: !prev[sportName],
    }));
  };

  // 🔹 Toggle type expand/collapse
  const toggleType = (sportName, typeName) => {
    setTypeToggle((prev) => ({
      ...prev,
      [`${sportName}-${typeName}`]: !prev[`${sportName}-${typeName}`],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Tournaments
        </h1>

        {/* Render grouped tournaments */}
        {Object.keys(groupedData).map((sportName) => (
          <div key={sportName} className="mb-4">
            {/* Sport Toggle */}
            <div
              onClick={() => toggleSport(sportName)}
              className="flex justify-between items-center cursor-pointer bg-white p-4 rounded-lg shadow"
            >
              <h2 className="text-2xl font-semibold text-gray-700">
                {sportName}
              </h2>
              <span className="text-xl">
                {sportToggle[sportName] ? "▼" : "▲"}
              </span>
            </div>

            {sportToggle[sportName] && (
              <div className="mt-4 ml-6">
                {Object.keys(groupedData[sportName]).map((type) => (
                  <div key={type} className="mb-6">
                    {/* Type Toggle */}
                    <div
                      onClick={() => toggleType(sportName, type)}
                      className="flex justify-between items-center cursor-pointer bg-gray-200 p-3 rounded-lg"
                    >
                      <h3 className="text-xl font-semibold text-gray-700">
                        {type}
                      </h3>
                      <span className="text-lg">
                        {typeToggle[`${sportName}-${type}`] ? "▼" : "▲"}
                      </span>
                    </div>

                    {/* Tournament List */}
                    {typeToggle[`${sportName}-${type}`] && (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                        {groupedData[sportName][type].map((tournament) => (
                          <li key={tournament._id}>
                            <IndividualTournament
                              title={tournament.name}
                              image={tournament.imageUrl}
                              sport={tournament.sport._id}
                              _id={tournament._id}
                              onDelete={handleDelete}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Add Tournament button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
          text-2xl font-bold text-gray-700 hover:shadow-xl hover:scale-[1.02] 
          transition-all duration-300 cursor-pointer"
        >
          + Add Tournament
        </button>

        {/* Tournament Modal Form */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Tournament</h2>
              <form onSubmit={handleOnSubmit} className="flex flex-col gap-4">
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

                {/* 🔹 Sport Dropdown */}
                <select
                  name="sport"
                  value={sport}
                  onChange={handleOnChange}
                  className="w-full border border-gray-300 rounded-lg p-2 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Sport</option>
                  {sportData.map((sp) => (
                    <option key={sp._id} value={sp._id}>
                      {sp.name}
                    </option>
                  ))}
                </select>

                {/* 🔹 Styled Tournament Logo Input */}
                <div className="w-full flex flex-col items-center">
                  <label
                    htmlFor="tournamentImageInput"
                    className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg 
               flex items-center justify-center text-gray-500 cursor-pointer 
               hover:border-blue-500 hover:text-blue-500 transition"
                  >
                    {image ? (
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "Upload Logo"
                    )}
                  </label>
                  <input
                    type="file"
                    id="tournamentImageInput"
                    name="image"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="border border-gray-500 bg-gray-400 px-4 py-2 rounded-lg 
                    hover:bg-gray-500 hover:border-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-green-600 bg-green-500 px-4 py-2 rounded-lg 
                    hover:bg-green-600 hover:border-green-700 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tournament;
