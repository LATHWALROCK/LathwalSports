import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualSport from "../components/Sport";
import { sportEndpoints } from "../services/apis";

const { GET_SPORT, CREATE_SPORT, DELETE_SPORT } = sportEndpoints;

function Sport() {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [showForm, setShowForm] = useState(false);
  const { name } = formData;

  const fetchData = async () => {
    try {
      const response = await fetch(GET_SPORT);
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      toast.error("Failed to fetch sports");
      console.error("FETCH SPORTS ERROR:", error);
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
    const toastId = toast.loading("Creating sport...");

    try {
      const response = await apiConnector("POST", CREATE_SPORT, { name });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Sport created successfully");
      setFormData({ name: "" });
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("CREATE SPORT ERROR:", error);
      toast.error("Sport creation failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleDelete = async (name) => {
    const toastId = toast.loading("Deleting sport...");
    try {
      const response = await apiConnector("DELETE", DELETE_SPORT, { name });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Sport deleted successfully");
      fetchData();
    } catch (error) {
      console.error("DELETE SPORT ERROR:", error);
      toast.error("Sport deletion failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Sports
        </h1>

        {/* Grid of sports */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {data.map((sport) => (
            <li key={sport._id}>
              <IndividualSport title={sport.name} onDelete={handleDelete} />
            </li>
          ))}
        </ul>

        {/* Add Sport button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
                     text-2xl font-bold text-gray-700 hover:shadow-xl hover:scale-[1.02] 
                     transition-all duration-300 cursor-pointer"
        >
          + Add Sport
        </button>
      </div>

      {/* 🔹 Popup Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
              Add Sport
            </h2>
            <form onSubmit={handleOnSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleOnChange}
                placeholder="Enter sport name"
                className="w-full border border-gray-300 rounded-lg p-2 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-center gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}

export default Sport;
