import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import { sportEndpoints } from "../services/apis";
import IndividualSport from "../components/Sport";

const { GET_SPORT, CREATE_SPORT, UPDATE_SPORT, DELETE_SPORT } = sportEndpoints;

function Sport() {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editData, setEditData] = useState({ _id: "", name: "" });
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
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

  // Image handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Edit image handler
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!name || !name.trim()) {
      toast.error("Sport name is required");
      return;
    }

    if (!image) {
      toast.error("Sport logo/image is required");
      return;
    }

    const toastId = toast.loading("Creating sport...");

    const formDataObj = new FormData();
    formDataObj.append("name", name.trim());
    formDataObj.append("image", image);

    apiConnector("POST", CREATE_SPORT, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Sport created successfully");
        // Reset form
        setFormData({ name: "" });
        setImage(null);
        setPreview(null);
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

  const handleEdit = (_id, currentName, sportData) => {
    setEditData({ _id, name: currentName });
    setEditPreview(sportData.imageUrl || null);
    setShowEditForm(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!editData.name || !editData.name.trim()) {
      toast.error("Sport name is required");
      return;
    }

    const toastId = toast.loading("Updating sport...");

    const formDataObj = new FormData();
    formDataObj.append("_id", editData._id);
    formDataObj.append("name", editData.name.trim());
    if (editImage) {
      formDataObj.append("image", editImage);
    }

    apiConnector("PUT", UPDATE_SPORT, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Sport updated successfully");
        // Reset edit form
        setEditData({ _id: "", name: "" });
        setEditImage(null);
        setEditPreview(null);
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

          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-6">
            {data.map((sport) => (
              <li key={sport._id}>
                <IndividualSport
                  title={sport.name}
                  image={sport.imageUrl}
                  _id={sport._id}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  sportData={sport}
                />
              </li>
            ))}
            {/* Add Sport Tile */}
            <li>
              <div
                onClick={() => setShowForm(true)}
                className="bg-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-center
                           text-3xl font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-600
                           hover:scale-105 transition-all duration-300 cursor-pointer min-h-[120px]"
                title="Add Sport"
              >
                +
              </div>
            </li>
          </ul>
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

              <label
                htmlFor="imageUpload"
                className="w-40 h-40 border-2 border-dashed border-black rounded-xl flex items-center justify-center
                cursor-pointer text-gray-500 hover:border-black transition mx-auto"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span>Upload Logo</span>
                )}
              </label>
              <input
                id="imageUpload"
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                required={!preview}
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
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ name: "" });
                    setImage(null);
                    setPreview(null);
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

              <label
                htmlFor="editImageUpload"
                className="w-40 h-40 border-2 border-dashed border-black rounded-xl flex items-center justify-center
                cursor-pointer text-gray-500 hover:border-black transition mx-auto"
              >
                {editPreview ? (
                  <img
                    src={editPreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span>Upload Logo</span>
                )}
              </label>
              <input
                id="editImageUpload"
                type="file"
                name="image"
                accept="image/*"
                onChange={handleEditImageChange}
                className="hidden"
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
                    setEditImage(null);
                    setEditPreview(null);
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