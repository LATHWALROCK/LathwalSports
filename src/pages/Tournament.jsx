import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualTournament from "../components/TournamentTile";
import { tournamentEndpoints, sportEndpoints } from "../services/apis";
import { useSearchParams } from "react-router-dom";

const {
  GET_TOURNAMENT,
  CREATE_TOURNAMENT,
  UPDATE_TOURNAMENT,
  DELETE_TOURNAMENT,
  GET_TOURNAMENT_BY_SPORT,
} = tournamentEndpoints;

const { GET_SPORT } = sportEndpoints;

function Tournament() {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({ name: "", sport: "", type: "" });
  const [editData, setEditData] = useState({ _id: "", name: "", sport: "", type: "" });
  const [sportData, setSportData] = useState([]);
  const [image, setImage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [tournamentType, setTournamentType] = useState(""); // "International" or "League"
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [searchParams] = useSearchParams();
  const sportParam = searchParams.get("sport");

  const { name, sport, type } = formData;

  const fetchData = useCallback(() => {
    const endpoint = sportParam ? GET_TOURNAMENT_BY_SPORT : GET_TOURNAMENT;
    const params = sportParam ? { sport: sportParam } : null;
    apiConnector("GET", endpoint, null, null, params)
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        toast.error("Failed to fetch tournaments");
        console.error("FETCH TOURNAMENTS ERROR:", error);
      });
  }, [sportParam]);

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchSportData = useCallback(() => {
    apiConnector("GET", GET_SPORT)
      .then((response) => {
        setSportData(response.data.data);
      })
      .catch((error) => {
        console.error("FETCH SPORTS ERROR:", error);
      });
  }, []);

  const handleOpenTypeSelection = () => {
    setShowTypeSelection(true);
  };

  const handleSelectType = (type) => {
    setTournamentType(type);
    setFormData((prev) => ({ ...prev, type, sport: sportParam || "" }));
    setShowTypeSelection(false);
    setShowForm(true);
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating tournament...");

    const formDataObj = new FormData();
    formDataObj.append("name", name);
    formDataObj.append("sport", sport);
    formDataObj.append("type", type);
    formDataObj.append("image", image);

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
        setTournamentType("");
        setShowForm(false);
        setShowTypeSelection(false);
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

  // Edit handlers
  const handleEdit = (_id, currentName) => {
    const tournament = data.find(t => t._id === _id);
    setEditData({
      _id,
      name: currentName,
      sport: tournament?.sport?._id || "",
      type: tournament?.type || ""
    });
    setEditPreview(tournament?.imageUrl || null);
    setShowEditForm(true);
  };

  const handleEditOnChange = (e) => {
    setEditData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Updating tournament...");

    const formDataObj = new FormData();
    formDataObj.append("_id", editData._id);
    formDataObj.append("name", editData.name);
    formDataObj.append("sport", editData.sport);
    formDataObj.append("type", editData.type);
    if (editImage) {
      formDataObj.append("image", editImage);
    }

    apiConnector("PUT", UPDATE_TOURNAMENT, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Tournament updated successfully");
        setEditData({ _id: "", name: "", sport: "", type: "" });
        setEditImage(null);
        setEditPreview(null);
        setShowEditForm(false);
        fetchData();
      })
      .catch((error) => {
        console.error("UPDATE TOURNAMENT ERROR:", error);
        toast.error("Tournament update failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  useEffect(() => {
    fetchData();
    fetchSportData();
    setFormData((prev) => ({ ...prev, sport: sportParam || "" }));
  }, [sportParam, fetchData, fetchSportData]);

  const getSportName = () => {
    const foundSport = sportData.find((s) => s._id === sport);
    return foundSport ? foundSport.name : "";
  };

  const getEditSportName = () => {
    const foundSport = sportData.find((s) => s._id === editData.sport);
    return foundSport ? foundSport.name : "";
  };

  // Filter tournaments by type
  const internationalTournaments = data.filter((t) => t.type === "International");
  const leagueTournaments = data.filter((t) => t.type === "League");

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Tournaments
        </h1>

        {/* International Tournament Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">International Tournament</h2>
          {internationalTournaments.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              {internationalTournaments.map((tournament) => (
                <li key={tournament._id}>
                  <IndividualTournament
                    title={tournament.name}
                    image={tournament.imageUrl}
                    sport={tournament.sport._id}
                    _id={tournament._id}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mb-6">No international tournaments yet</p>
          )}
        </div>

        {/* Leagues Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Leagues</h2>
          {leagueTournaments.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              {leagueTournaments.map((tournament) => (
                <li key={tournament._id}>
                  <IndividualTournament
                    title={tournament.name}
                    image={tournament.imageUrl}
                    sport={tournament.sport._id}
                    _id={tournament._id}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mb-6">No leagues yet</p>
          )}
        </div>

        {/* Single Add Tournament Button */}
        <button
          onClick={handleOpenTypeSelection}
          className="w-full bg-gray-100 ring-1 ring-black rounded-2xl p-6 flex items-center justify-center 
          text-xl font-bold text-black hover:bg-gray-200 hover:scale-[1.02] 
          transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!sportParam}
        >
          + Add Tournament
        </button>

        {/* Type Selection Modal */}
        {showTypeSelection && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-6 text-center">Select Tournament Type</h2>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleSelectType("International")}
                  className="w-full bg-gray-100 ring-1 ring-black rounded-lg p-4 text-lg font-semibold text-black hover:bg-gray-200 transition"
                >
                  International Tournament
                </button>
                <button
                  onClick={() => handleSelectType("League")}
                  className="w-full bg-gray-100 ring-1 ring-black rounded-lg p-4 text-lg font-semibold text-black hover:bg-gray-200 transition"
                >
                  League
                </button>
                <button
                  onClick={() => setShowTypeSelection(false)}
                  className="w-full border border-black bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tournament Modal Form */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-4">
                Add {tournamentType === "International" ? "International Tournament" : "League"}
              </h2>
              <form onSubmit={handleOnSubmit} className="flex flex-col gap-4">
                {/* Display Sport */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Sport:</label>
                  <p className="font-semibold">{getSportName()}</p>
                </div>

                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{type}</p>
                </div>

                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={handleOnChange}
                  placeholder="Enter tournament name"
                  className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input type="hidden" name="sport" value={sport} />
                <input type="hidden" name="type" value={type} />

                {/* 🔹 Styled Tournament Logo Input */}
                <div className="w-full flex flex-col items-center">
                  <label
                    htmlFor="tournamentImageInput"
                    className="w-32 h-32 border-2 border-dashed border-black rounded-lg 
               flex items-center justify-center text-gray-500 cursor-pointer 
               hover:border-black transition"
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
                    onClick={() => {
                      setShowForm(false);
                      setShowTypeSelection(false);
                      setFormData({ name: "", type: "", sport: "" });
                      setImage(null);
                      setTournamentType("");
                    }}
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg 
                    hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg 
                    hover:bg-gray-200 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Tournament Modal */}
        {showEditForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-4 text-center">
                Edit Tournament
              </h2>
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                {/* Display Sport */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Sport:</label>
                  <p className="font-semibold">{getEditSportName()}</p>
                </div>

                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{editData.type}</p>
                </div>

                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditOnChange}
                  placeholder="Enter tournament name"
                  className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input type="hidden" name="sport" value={editData.sport} />
                <input type="hidden" name="type" value={editData.type} />

                {/* 🔹 Styled Tournament Logo Input */}
                <div className="w-full flex flex-col items-center">
                  <label
                    htmlFor="editTournamentImageInput"
                    className="w-32 h-32 border-2 border-dashed border-black rounded-lg
               flex items-center justify-center text-gray-500 cursor-pointer
               hover:border-black transition"
                  >
                    {editPreview ? (
                      <img
                        src={editPreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "Upload Logo"
                    )}
                  </label>
                  <input
                    type="file"
                    id="editTournamentImageInput"
                    name="image"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditData({ _id: "", name: "", sport: "", type: "" });
                      setEditImage(null);
                      setEditPreview(null);
                    }}
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Update
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
