import React, { useState, useEffect } from "react";
import axios from "axios";

// Get port from URL query parameter or default to 8080
const urlParams = new URLSearchParams(window.location.search);
const subscriberPort = urlParams.get("port") || "8080";
const backendHost = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
const subscriberUrl = `${backendHost}`;

// Unique keys for storing data per subscriber instance
const storageKey = `subscribedTopics_${subscriberPort}`;
const messagesKey = `messages_${subscriberPort}`;

function App() {
  const [subscriberId, setSubscriberId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [subscribedTopics, setSubscribedTopics] = useState(
    JSON.parse(localStorage.getItem(storageKey)) || []
  );
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem(messagesKey)) || {}
  );

  // Fetch Subscriber ID
  const fetchSubscriberId = async () => {
    try {
      const url = `${subscriberUrl}/subscriber/getSubscriberId`;
      console.log(url);
      const response = await axios.get(`${subscriberUrl}/subscriber/getSubscriberId`);
      setSubscriberId(response.data);
    } catch (error) {
      console.error("Error fetching subscriber ID:", error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${subscriberUrl}/subscriber/getTopics?subscriberUrl=${subscriberUrl}`);
      setTopics(response.data);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const subscribeToTopic = async () => {
    if (!selectedTopic) return alert("Select a topic to subscribe.");
    try {
      await axios.post(`${subscriberUrl}/subscriber/subscribe`, { topic: selectedTopic });
      const updatedTopics = [...new Set([...subscribedTopics, selectedTopic])];
      setSubscribedTopics(updatedTopics);
      localStorage.setItem(storageKey, JSON.stringify(updatedTopics));
      alert(`🔥 Subscribed to: ${selectedTopic}`);
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const unsubscribeFromTopic = async (topic) => {
    try {
      await axios.post(`${subscriberUrl}/subscriber/unsubscribe`, { topic });
      const updatedTopics = subscribedTopics.filter((t) => t !== topic);
      setSubscribedTopics(updatedTopics);
      localStorage.setItem(storageKey, JSON.stringify(updatedTopics));
      alert(`💀 Unsubscribed from: ${topic}`);
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
  };

  const fetchMessages = async () => {
    try {
        const response = await axios.get(`${subscriberUrl}/subscriber/receiveMessages`);
        const storedMessages = JSON.parse(localStorage.getItem(messagesKey)) || {};
        const newMessages = { ...storedMessages };

        // Get current time in UTC (milliseconds)
        const now = Date.now();
        const fifteenMinutesAgo = now - 15 * 60 * 1000;

        response.data.forEach((msg) => {
            if (!newMessages[msg.topic]) {
                newMessages[msg.topic] = [];
            }
            newMessages[msg.topic].push(msg);
        });

        // Filter out messages older than 15 minutes
        for (let topic in newMessages) {
            newMessages[topic] = newMessages[topic].filter((msg) => {
                const messageTimestamp = Date.parse(msg.timestamp + "Z"); // Ensure UTC parsing
                return !isNaN(messageTimestamp) && messageTimestamp > fifteenMinutesAgo;
            });

            // Remove topic from localStorage if it has no fresh messages left
            if (newMessages[topic].length === 0) {
                delete newMessages[topic];
            }
        }

        // Save only fresh messages to localStorage
        localStorage.setItem(messagesKey, JSON.stringify(newMessages));

        // Update React state
        setMessages(newMessages);

    } catch (error) {
        console.error("Error fetching messages:", error);
    }
};




useEffect(() => {
  // Check if it's a fresh session
  const isNewSession = !localStorage.getItem("sessionActive");

  if (isNewSession) {
      // Clear previous messages on new session
      localStorage.removeItem(storageKey);
      localStorage.removeItem(messagesKey);
      localStorage.setItem("sessionActive", "true");
      setSubscribedTopics([]);
      setMessages({});
  }

  fetchSubscriberId();
  fetchTopics();
  fetchMessages();

  // Run fetchMessages every 5 seconds to auto-remove old messages
  const interval = setInterval(() => {
      fetchMessages();
      fetchTopics();
  }, 5000);

  return () => clearInterval(interval);
}, []);


  return (
    <div style={{ padding: "20px", fontFamily: "'Poppins', sans-serif", backgroundColor: "#1E1E2E", minHeight: "100vh", color: "#EAEAEA" }}>

      {/* Subscriber ID at Top-Right */}
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#333", padding: "8px 15px", borderRadius: "12px", boxShadow: "0px 4px 6px rgba(255,255,255,0.2)" }}>
        <span style={{ fontSize: "1.5rem" }}>👤</span>
        <span style={{ fontSize: "1.2rem", color: "#FFD700", fontWeight: "bold" }}>
          {subscriberId ? subscriberId : "Loading..."}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        Sports Buzz 🏀🏈🏏🏓 
      </h1>

      <h3 style={{ textAlign: "center", fontStyle: "italic", fontSize: "1.2rem", color: "#B8B8B8" }}>
        Stay hyped! ⚡ Subscribe to your favorite sports & get the latest buzz!
      </h3>

      {/* Subscription Section */}
      <div style={{ maxWidth: "600px", margin: "30px auto", textAlign: "center", backgroundColor: "#2A2A3A", padding: "20px", borderRadius: "12px", boxShadow: "0px 4px 10px rgba(0,0,0,0.5)", color: "#FFF" }}>
        <h2 style={{ fontSize: "1.4rem", color: "#FFD700" }}>Subscribe to a Topic</h2>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "1rem", border: "1px solid #FFD700", backgroundColor: "#333", color: "#FFF" }}>
            <option value="">Select a topic</option>
            {topics.map((topic, index) => (
              <option key={index} value={topic}>{topic}</option>
            ))}
          </select>
          <button onClick={subscribeToTopic} style={{ backgroundColor: "#FF4500", color: "white", border: "none", padding: "10px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}>
            🚀 Subscribe
          </button>
        </div>

        {/* Subscribed Topics */}
        {subscribedTopics.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h2 style={{ color: "#FFD700", fontSize: "1.4rem" }}>Subscribed Topics</h2>
            {subscribedTopics.map((topic, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#444", padding: "10px", borderRadius: "8px", margin: "5px 0" }}>
                <span style={{ color: "#FFF", fontSize: "1.1rem" }}>{topic}</span>
                <button onClick={() => unsubscribeFromTopic(topic)} style={{ backgroundColor: "#D72638", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}>
                  ❌ Unsubscribe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Sports Updates */}
      <h2 style={{ color: "#FFD700", textAlign: "center", marginTop: "40px", fontSize: "1.6rem" }}>
        🔥 Live Sports Updates
      </h2>

      {/* Render Messages with Timestamp */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", padding: "20px" }}>
        {Object.keys(messages).map((topic, index) => (
          <div key={index} style={{ backgroundColor: "#333", padding: "15px", borderRadius: "10px" }}>
            <h3 style={{ color: "#FFD700" }}>{topic.toUpperCase()}</h3>
            {messages[topic]?.map((msg, idx) => (
              <p key={idx} style={{ color: "#00FFFF" }}>
                {msg.message}{" "}
                <small style={{ color: "#FFD700", marginLeft: "10px" }}>
                {new Date(msg.timestamp + "Z").toLocaleString(undefined, { timeZoneName: "short" })}
                </small>
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
