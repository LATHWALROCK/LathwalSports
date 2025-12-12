import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import { sportEndpoints } from "../services/apis";
import IndividualSport from "../components/Sport";

const { GET_SPORT, CREATE_SPORT, UPDATE_SPORT, DELETE_SPORT } = sportEndpoints;

function Sport() {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [editData, setEditData] = useState({ _id: "", name: "" });
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const { name } = formData;

  const fetchData = () => {
    fetch(GET_SPORT)
      .then((response) => response.json())
      .then((result) => {
        setData(result.data);
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
    const toastId = toast.loading("Creating sport...");

    apiConnector("POST", CREATE_SPORT, { name })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Sport created successfully");
        setFormData({ name: "" });
        setShowForm(false);
        fetchData();
      })
      .catch((error) => {
        console.error("CREATE SPORT ERROR:", error);
        toast.error("Sport creation failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  const handleEdit = (_id, currentName) => {
    setEditData({ _id, name: currentName });
    setShowEditForm(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Updating sport...");

    apiConnector("PUT", UPDATE_SPORT, editData)
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Sport updated successfully");
        setEditData({ _id: "", name: "" });
        setShowEditForm(false);
        fetchData();
      })
      .catch((error) => {
        console.error("UPDATE SPORT ERROR:", error);
        toast.error("Sport update failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  const handleEditOnChange = (e) => {
    setEditData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDelete = (_id) => {
    setData((prevData) => prevData.filter((item) => item._id !== _id));
    apiConnector("DELETE", DELETE_SPORT, { _id })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Sport deleted successfully");
      })
      .catch((error) => {
        console.error("DELETE SPORT ERROR:", error);
        toast.error("Sport deletion failed");
        fetchData();
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Sports
          </h1>

          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
            {data.map((sport) => (
              <li key={sport._id}>
                <IndividualSport
                  title={sport.name}
                  _id={sport._id}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </li>
            ))}
          </ul>

          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gray-100 ring-1 ring-black rounded-2xl p-6 flex items-center justify-center
                       text-2xl font-bold text-black hover:bg-gray-200 hover:scale-[1.02]
                       transition-all duration-300 cursor-pointer"
          >
            + Add Sport
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white text-black rounded-2xl shadow-lg p-6 w-96 ring-1 ring-black">
            <h2 className="text-xl font-bold mb-4 text-center">
              Add Sport
            </h2>
            <form onSubmit={handleOnSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleOnChange}
                placeholder="Enter sport name"
                className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-center gap-3">
                <button
                  type="submit"
                  className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                             hover:bg-gray-200 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                             hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white text-black rounded-2xl shadow-lg p-6 w-96 ring-1 ring-black">
            <h2 className="text-xl font-bold mb-4 text-center">
              Edit Sport
            </h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditOnChange}
                placeholder="Enter sport name"
                className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-center gap-3">
                <button
                  type="submit"
                  className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                             hover:bg-gray-200 transition"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditData({ _id: "", name: "" });
                  }}
                  className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                             hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Sport;