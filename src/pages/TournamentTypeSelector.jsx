import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiConnector } from "../services/apiConnector";
import { sportEndpoints } from "../services/apis";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

const { GET_SPORT } = sportEndpoints;

function TournamentTypeSelector() {
  const [sportData, setSportData] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sportId = searchParams.get("sport");

  useEffect(() => {
    const fetchSportData = async () => {
      try {
        const response = await apiConnector("GET", GET_SPORT);
        setSportData(response.data.data);
      } catch (error) {
        console.error("FETCH SPORTS ERROR:", error);
        toast.error("Failed to fetch sports data");
      }
    };

    fetchSportData();
  }, []);

  const handleTypeSelect = (type) => {
    // Navigate to tournament page with both sport and type parameters
    navigate(`/tournament?sport=${sportId}&type=${type}`);
  };

  const getSportName = () => {
    const sport = sportData.find(s => s._id === sportId);
    return sport ? sport.name : "Unknown Sport";
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-black h-[calc(100vh-4rem)] relative">
      {/* Back Button - Top Left Corner */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-20 left-6 bg-gray-100 shadow-md rounded-lg p-3 text-black
                   hover:bg-gray-200 transition-colors duration-300 z-10"
        title="Back to Sports"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Title - Top Center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="text-4xl font-bold text-black">
          {getSportName()} Tournaments
        </h1>
      </div>

      {/* Tournament Tiles - Centered */}
      <div className="flex items-center justify-center h-full px-4">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* International Tournament Card */}
            <div
              onClick={() => handleTypeSelect("International")}
              className="bg-gray-100 shadow-lg rounded-2xl p-8 flex flex-col items-center justify-center
                         text-center hover:bg-gray-200 hover:scale-105 transition-all duration-300
                         cursor-pointer group"
            >
              <h2 className="text-2xl font-bold">International Tournaments</h2>
            </div>

            {/* League Card */}
            <div
              onClick={() => handleTypeSelect("League")}
              className="bg-gray-100 shadow-lg rounded-2xl p-8 flex flex-col items-center justify-center
                         text-center hover:bg-gray-200 hover:scale-105 transition-all duration-300
                         cursor-pointer group"
            >
              <h2 className="text-2xl font-bold">Leagues</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TournamentTypeSelector;
