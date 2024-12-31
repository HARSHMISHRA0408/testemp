
import { useEffect, useState } from "react";
import Layout from "./Layout";
import { ClipLoader } from "react-spinners"; // Import spinner from react-spinners
import { parse } from "cookie";
import jwt from "jsonwebtoken";


// Server-side authentication to restrict access to admin users
export async function getServerSideProps({ req }) {
  const redirectToLogin = {
    redirect: {
      destination: "/auth/Login",
      permanent: false,
    },
  };

  try {
    // Parse cookies manually to ensure proper extraction
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.token;

    // Redirect if token is missing
    if (!token || token.trim() === "") {
      console.error("No token found in cookies");
      return redirectToLogin;
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the role is "manager"
    if (decoded.role !== "manager") {
      console.error(`Unauthorized role: ${decoded.role}`);
      return redirectToLogin;
    }

    // Token is valid, and role is "manager"
    return {
      props: {
        user: decoded, // Pass decoded user info if needed
      },
    };
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return redirectToLogin;
  }
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchFeedbacks() {
      setLoading(true); // Start loading

      try {
        const response = await fetch("/api/feedback/getfeedbacks");
        if (!response.ok) {
          throw new Error("Failed to fetch feedbacks");
        }
        const result = await response.json();
        setFeedbacks(result.data || []);
        setFilteredFeedbacks(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); // Stop loading
      }
    }

    fetchFeedbacks();
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = feedbacks.filter(
      (feedback) =>
        feedback.email.toLowerCase().includes(query) ||
        feedback.feedback.toLowerCase().includes(query)
    );
    setFilteredFeedbacks(filtered);
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-200 min-h-screen py-10 px-6 flex justify-center">
      <div className="container max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center border-b pb-4">
          User Feedbacks
        </h1>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by email or feedback"
            className="w-full md:w-3/4 lg:w-2/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Centered Loading Animation */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <ClipLoader size={50} color="#3498db" loading={loading} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-center font-medium">
            Error: {error}
          </p>
        )}

        {/* Feedback List */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredFeedbacks.length === 0 ? (
              <p className="text-gray-600 text-center text-lg">
                No feedbacks available
              </p>
            ) : (
              filteredFeedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="p-6 bg-gray-50 rounded-lg shadow-md transition transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <h2 className="text-xl font-bold text-indigo-600 mb-2">
                    Feedback
                  </h2>
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Submitted At:</span>
                    <span className="text-sm text-gray-800 font-medium block">
                      {new Date(feedback.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="text-gray-800 font-medium break-words">
                      {feedback.email}
                    </p>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Feedback:</span>
                    <p className="text-gray-800 font-medium break-words">
                      {feedback.feedback}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

FeedbackPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
