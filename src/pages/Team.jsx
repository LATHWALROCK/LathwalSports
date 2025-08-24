import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualTeam from "../components/TeamTile";
import { teamEndpoints } from "../services/apis";

const { GET_TEAM, CREATE_TEAM, DELETE_TEAM } = teamEndpoints;

function Team() {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({ name: "", city: "" });
  const [image, setImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { name, city } = formData;

  const fetchData = async () => {
    try {
      const response = await apiConnector("GET", GET_TEAM);
      setData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch team");
      console.error("FETCH TEAMS ERROR:", error);
    }
  };

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
      [e.target.city]: e.target.value,
    }));
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating team...");

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", name);
      formDataObj.append("city", city);
      formDataObj.append("image", image);

      const response = await apiConnector("POST", CREATE_TEAM, formDataObj, {
        "Content-Type": "multipart/form-data",
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Team created successfully");
      setFormData({ name: "", city: "" });
      setImage(false);
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("CREATE TEAM ERROR:", error);
      toast.error("Team creation failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleDelete = async (name,city) => {
    
    const toastId = toast.loading("Deleting Team...");
    try {
      const response = await apiConnector("DELETE", DELETE_TEAM, {name,city});
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Team deleted successfully");
      fetchData();
    } catch (error) {
      console.error("DELETE TEAM ERROR:", error);
      toast.error("Team deletion failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Teams
        </h1>

        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          {data.map((team) => (
            <li key={team._id}>
              <IndividualTeam title={team.name} image={team.imageUrl} city={team.city} onDelete={handleDelete}/>
            </li>
          ))}
        </ul>

        {/* Add Team button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
            text-2xl font-bold text-gray-700 hover:shadow-xl hover:scale-[1.02] 
            transition-all duration-300 cursor-pointer"
          >
            + Add Team
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
              name="city"
              value={city}
              onChange={handleOnChange}
              placeholder="Enter team city"
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

export default Team;
