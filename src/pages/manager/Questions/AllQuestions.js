import { useRouter } from "next/router";
import Layout from "../Layout"; // Adjust the path if needed
import { useState, useEffect } from "react";
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

function AllQuestions({ initialQuestions = [] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const fetchQuestions = async () => {
    setLoading(true); // Start loading
    try {
      const res = await fetch("/api/questions/getQuestions");
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      } else {
        console.error("Failed to fetch questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
    setLoading(false); // Start loading
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredQuestions = questions.filter((question) =>
    question.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!initialQuestions.length) {
      fetchQuestions();
    }
  }, [initialQuestions]);

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>All Questions</h1>
      

      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search questions..."
          style={{
            padding: "10px",
            width: "60%",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "1rem",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          }}
        />
        <button
          onClick={() => router.push("/admin/Questions/addQuestion")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            fontSize: "1rem",
          }}
        >
          Add Question
        </button>
      </div>

      <div>
      {/* {loading && (
          <div className="flex justify-center items-center h-64">
            <ClipLoader size={50} color="#3498db" loading={loading} />
          </div>
        )} */}
        
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <div
              key={question._id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#fff",
                transition: "all 0.3s ease",
                display: "flex",
                justifyContent: "space-between", // Aligning the elements
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "10px" }}>
                  {question.question}
                </h3>
                <p style={{ fontSize: "1rem", marginBottom: "5px" }}>
                  <strong>Category:</strong> {question.category}
                </p>
                <p style={{ fontSize: "1rem", marginBottom: "10px" }}>
                  <strong>Difficulty:</strong> {question.difficulty}
                </p>
              </div>

        

              <button
                onClick={() => router.push(`/questions/edit/${question._id}`)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#0056b3")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
              >
                Edit
              </button>
            </div>
          ))
        ) : (
          <p>No questions available.</p>
        )}
      </div>
    </div>
  );
}

// Apply layout to the AllQuestions page
AllQuestions.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default AllQuestions;
