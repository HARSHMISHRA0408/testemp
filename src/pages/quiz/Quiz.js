import { useState, useEffect, useRef } from "react";
import Layout from "../candidate/CandidateLayout";
// import { Router, useRouter } from "next/router";
import Router, { useRouter } from "next/router";
import React from "react";

export default function Quiz() {
  const [questions, setQuestions] = useState({ easy: [], medium: [], hard: [] });
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState("easy");
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [tokenData, setTokenData] = useState(null);
  const askedQuestions = useRef(new Set());
  const consecutiveIncorrect = useRef(0);
  const MIN_QUESTIONS = 10;
  const router = useRouter();


  //FETCHING QUESTIONS AND DIVIDING IN DIFFERENT LEVELS
  // useEffect(() => {
    
  //   const fetchQuestions = async () => {
  //     try {
  //       const response = await fetch("/api/questions/getQuestions");
  //       if (!response.ok) throw new Error("Failed to fetch questions: " + response.statusText);

  //       const data = await response.json();
  //       if (!data?.data) throw new Error("Invalid response format.");
  //       const allQuestions = data.data;

  //       const easy = allQuestions.filter((q) => q.difficulty.toLowerCase() === "easy");
  //       const medium = allQuestions.filter((q) => q.difficulty.toLowerCase() === "medium");
  //       const hard = allQuestions.filter((q) => q.difficulty.toLowerCase() === "hard");

  //       setQuestions({ easy, medium, hard });

  //       const firstEasy = easy[0];
  //       setCurrentQuestion(firstEasy);
  //       askedQuestions.current.add(firstEasy._id || firstEasy.question); // Unique identifier
  //     } catch (error) {
  //       console.error("Error fetching questions:", error);
  //     }
  //   };

  //   fetchQuestions();
  // }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        setTokenData({
          knowledgeArea: decodedToken.knowledgeArea,
          category: decodedToken.category,
        });
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    } else {
      console.warn("No token found in localStorage.");
    }
  }, []);

// Fetch and filter questions
useEffect(() => {
  const fetchQuestions = async () => {
    try {
      console.log("Fetching questions from the API...");

      const response = await fetch("/api/questions/getQuestions");
      if (!response.ok) throw new Error("Failed to fetch questions: " + response.statusText);

      console.log("API response received successfully.");

      const data = await response.json();
      console.log("Parsed response data:", data);

      if (!data?.data) throw new Error("Invalid response format.");

      const allQuestions = data.data;
      console.log("Total questions fetched:", allQuestions.length);

      // Apply filters based on knowledgeArea and category
      const { knowledgeArea, category } = tokenData || {};
      console.log("Applying filters with knowledgeArea:", knowledgeArea, "and category:", category);

      const filteredQuestions = allQuestions.filter(
        (q) =>
          (!knowledgeArea || q.knowledge_area === knowledgeArea) &&
          (!category || q.category === category)
      );
      console.log("Filtered questions count:", filteredQuestions.length);

      // Divide questions by difficulty
      const easy = filteredQuestions.filter((q) => q.difficulty.toLowerCase() === "easy");
      const medium = filteredQuestions.filter((q) => q.difficulty.toLowerCase() === "medium");
      const hard = filteredQuestions.filter((q) => q.difficulty.toLowerCase() === "hard");

      console.log("Easy questions count:", easy.length);
      console.log("Medium questions count:", medium.length);
      console.log("Hard questions count:", hard.length);

      setQuestions({ easy, medium, hard });

      // Set the first question
      const firstEasy = easy[0];
      if (firstEasy) {
        console.log("Setting the first easy question as current question:", firstEasy);
        setCurrentQuestion(firstEasy);
        askedQuestions.current.add(firstEasy._id || firstEasy.question); // Unique identifier
      } else {
        console.log("No easy questions found to set as the current question.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  // Fetch questions only if token data is available
  if (tokenData) {
    console.log("Token data available. Proceeding to fetch questions.");
    fetchQuestions();
  } else {
    console.log("Token data not available. Skipping question fetch.");
  }
}, [tokenData]);




  //HANDLEING IF TIOM BECOMES 0.
  useEffect(() => {
    if (timeLeft === 0) {
      handleNextQuestion(false);
      return;
    }
    if (currentQuestion && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [currentQuestion, timeLeft]);

  const handleAnswer = (optionText) => {
    const isCorrect = optionText === currentQuestion.correct_option;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      consecutiveIncorrect.current = 0; // Reset counter on correct answer
    } else {
      consecutiveIncorrect.current += 1;
    }

    handleNextQuestion(isCorrect);
  };

  const getNextQuestion = (difficulty) => {
    const difficultyArray = questions[difficulty];
    return difficultyArray.find((q) => !askedQuestions.current.has(q._id || q.question));
  };

  const handleNextQuestion = (isCorrect) => {
    setQuestionsAsked((prev) => prev + 1);

    if (questionsAsked >= MIN_QUESTIONS) {
      setIsQuizComplete(true);
      submitResults();
      return;
    }

    let nextDifficulty = currentDifficulty;

    if (!isCorrect && consecutiveIncorrect.current >= 3) {
      if (currentDifficulty === "medium") {
        nextDifficulty = "easy";
      } else if (currentDifficulty === "hard") {
        nextDifficulty = "medium";
      }
      consecutiveIncorrect.current = 0; // Reset counter after difficulty decrease
    } else if (isCorrect) {
      if (currentDifficulty === "easy" && questions.medium.length > 0) {
        nextDifficulty = "medium";
      } else if (currentDifficulty === "medium" && questions.hard.length > 0) {
        nextDifficulty = "hard";
      }
    }

    let nextQuestion = getNextQuestion(nextDifficulty);

    if (!nextQuestion) {
      nextQuestion = getNextQuestion(currentDifficulty);
    }

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setCurrentDifficulty(nextDifficulty);
      setTimeLeft(nextDifficulty === "easy" ? 60 : nextDifficulty === "medium" ? 120 : 180);
      askedQuestions.current.add(nextQuestion._id || nextQuestion.question);
    } else {
      setIsQuizComplete(true);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("Error: User not logged in.");
      return;
    }

    try {
      const response = await fetch("/api/feedback/savefeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feedback }),
      });

      router.push("/candidate/Dashboard");
      const data = await response.json();
      if (data.success) {
        setIsFeedbackSubmitted(true);
        alert("Feedback submitted successfully!");
      } else {
        alert("Error submitting feedback.");
      }
    } catch (error) {
      alert("Error submitting feedback: " + error.message);
    }

     // Clear the JWT token from local storage
     localStorage.removeItem("token");
     localStorage.removeItem("email");
 
     // Optionally, clear any other user-related data
 
     // Redirect to the login page or home page
     Router.push("/auth/Login"); // Adjust the path as necessary
  };

  // const submitResults = () => {
  //   const email = localStorage.getItem("userEmail");
  //   if (!email) {
  //     alert("Error: User not logged in.");
  //     return;
  //   }

  //   fetch("/api/results/saveresult", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ email, score }),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data.success) alert("Result saved successfully!");
  //     })
  //     .catch((error) => alert("Error saving result.", error));

  //     setIsQuizComplete(true);
  //     return;
  // };

  const submitResults = () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("Error: User not logged in.");
      return;
    }
  
    // Save the quiz result
    fetch("/api/results/saveresult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, score }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Result saved successfully!");
  
          // Update the user's 'test' status to 'notallowed'
          fetch("/api/testupdate", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Ensure token is stored and retrieved
            },
            body: JSON.stringify({ email, test: "notallowed" }),
          })
            .then((response) => response.json())
            .then((updateData) => {
              if (updateData.success) {
                alert("User's test status updated to 'notallowed'.");
              } else {
                alert(
                  updateData.message || "Failed to update user's test status."
                );
              }
            })
            .catch((error) =>
              alert("Error updating user's test status: " + error.message)
            );
        } else {
          alert(data.message || "Failed to save the quiz result.");
        }
      })
      .catch((error) => alert("Error saving result: " + error.message))
      .finally(() => setIsQuizComplete(true));


  };
  

  return (
    <div className="quiz-container mx-auto mt-10 max-w-3xl bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Quiz</h1>
      {!isQuizComplete ? (
        currentQuestion ? (
          <>
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-700">
                Score: <span className="font-bold">{score}</span>
              </p>
              <p className="text-lg font-medium text-gray-700">
                Time left: <span className="font-bold">{timeLeft}s</span>
              </p>
              <p className="text-lg font-medium text-gray-700">
                Difficulty: <span className="font-bold">{currentDifficulty}</span>
              </p>
              <p className="text-lg font-medium text-gray-700">
                Questions Asked: <span className="font-bold">{questionsAsked}</span>
              </p>
            </div>
  
            <div className="mb-6">
              <p className="text-xl font-semibold text-gray-900">{currentQuestion.question}</p>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option.text)}
                  className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow transition duration-200"
                >
                  {option.text}
                </button>
              ))}
            </div>
  
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handleNextQuestion(false)}
                className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow transition duration-200"
              >
                Next
              </button>
              <button
                onClick={submitResults}
                className="py-2 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow transition duration-200"
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-lg text-gray-500">Loading question...</p>
        )
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
          <p className="text-lg font-medium text-gray-700 mb-4">
            Your Score: <span className="font-bold">{score}</span>
          </p>
  
          {!isFeedbackSubmitted ? (
            <form onSubmit={handleFeedbackSubmit} className="mt-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full border p-2 rounded mb-4"
                rows="4"
                placeholder="Share your feedback..."
                required
              />
              <button
                type="submit"
                className="py-2 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow transition duration-200"
              >
                Submit Feedback
              </button>
            </form>
          ) : (
            <p className="text-green-600 font-medium">Thank you for your feedback!</p>
          )}
        </div>
      )}
    </div>
  );
} 

// Apply the layout to the Quiz page
Quiz.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};