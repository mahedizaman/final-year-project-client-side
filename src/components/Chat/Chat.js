import {
  getFirestore,
  collection,
  orderBy,
  query,
  serverTimestamp,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  chatApp,
  publicUserAuth,
  publicUserStorage,
} from "../../firebase.config";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  Button,
  LinearProgress,
  Typography,
  TextField,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Attachment,
  Send,
  PictureAsPdf,
  Description,
  Image,
} from "@mui/icons-material";
 
const db = getFirestore(chatApp);
 
const Chat = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [user] = useAuthState(publicUserAuth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [employee, setEmployee] = useState(null);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const { id } = useParams();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
 
  // Fetch employee data
  useEffect(() => {
    axios
      .get(`http://localhost:8080/employee/${id}`)
      .then((data) => setEmployee(data.data))
      .catch((err) => console.log(err));
  }, [id]);
 
  // Fetch and listen to messages
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }))
      );
    });
    return unsubscribe;
  }, []);
 
  // Filter messages for this chat
  useEffect(() => {
    if (user && employee) {
      setFilteredMessages(
        messages.filter(
          (message) =>
            (message.data.receiverEmail === employee?.email &&
              message.data.email === user?.email) ||
            (message.data.receiverEmail === user?.email &&
              message.data.email === employee?.email)
        )
      );
    }
  }, [messages, user, employee]);
 
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
 
  // Handle file upload
  const handleUpload = () => {
    if (!selectedFile) {
      setError("No file selected");
      toast.warn("No file selected");
      return;
    }
 
    const size = selectedFile.size / 1000000;
    if (size > 100) {
      setError("File size cannot exceed 100MB");
      toast.error("File size cannot exceed 100MB");
      return;
    }
 
    setError(null);
 
    const storageRef = ref(
      publicUserStorage,
      `client/${user?.email}/${
        selectedFile.name.split(".")[0]
      }-${uuidv4()}.${selectedFile.name.split(".").pop()}`
    );
 
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      },
      (error) => {
        console.error("Upload error:", error);
        setError("File upload failed");
        toast.error("File upload failed");
        setProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, "messages"), {
            email: user?.email,
            photoURL: user?.photoURL,
            displayName: user?.displayName,
            text: downloadURL,
            timestamp: serverTimestamp(),
            receiverEmail: employee?.email,
            fileType: selectedFile.type,
            fileName: selectedFile.name,
          });
          setSelectedFile(null);
          toast.success("File sent successfully");
          if (fileInputRef.current) fileInputRef.current.value = "";
          setProgress(null);
        } catch (err) {
          console.error("Error adding document: ", err);
          setError("Failed to send message");
          toast.error("Failed to send message");
        }
      }
    );
  };
 
  // Send text message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
 
    try {
      await addDoc(collection(db, "messages"), {
        email: user?.email,
        photoURL: user?.photoURL,
        displayName: user?.displayName,
        text: newMessage,
        timestamp: serverTimestamp(),
        receiverEmail: employee?.email,
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error adding document: ", err);
      setError("Failed to send message");
      toast.error("Failed to send message");
    }
  };
 
  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
 
  // Render file icon based on file type
  const renderFileIcon = (fileUrl, fileName) => {
    if (fileUrl.includes(".pdf")) {
      return <PictureAsPdf style={{ fontSize: "40px" }} color="error" />;
    } else if (
      fileUrl.includes(".doc") ||
      fileUrl.includes(".docx") ||
      fileName.includes(".doc") ||
      fileName.includes(".docx")
    ) {
      return <Description style={{ fontSize: "40px" }} color="primary" />;
    } else if (
      fileUrl.includes(".jpg") ||
      fileUrl.includes(".jpeg") ||
      fileUrl.includes(".png") ||
      fileName.includes(".jpg") ||
      fileName.includes(".jpeg") ||
      fileName.includes(".png")
    ) {
      return <Image style={{ fontSize: "40px" }} color="secondary" />;
    } else {
      return <Attachment style={{ fontSize: "40px" }} />;
    }
  };
 
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
 
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#2E3135",
          color: "white",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Avatar src={employee?.photoURL} alt={employee?.displayName} />
        <div>
          <Typography variant="h6" style={{ margin: 0 }}>
            {employee?.displayName}
          </Typography>
          <Typography variant="body2" style={{ margin: 0 }}>
            {employee?.email}
          </Typography>
        </div>
      </div>
 
      {/* Messages Section */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent:
                msg.data.email === user?.email ? "flex-end" : "flex-start",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "70%",
              }}
            >
              <div
                style={{
                  backgroundColor:
                    msg.data.email === user?.email ? "#1976d2" : "#e0e0e0",
                  color:
                    msg.data.email === user?.email
                      ? "white"
                      : "rgba(0, 0, 0, 0.87)",
                  padding: "16px",
                  borderRadius: "16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  wordBreak: "break-word",
                }}
              >
                {msg.data.text?.includes("https") || msg.data.fileType ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <a
                      href={msg.data.text}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color:
                          msg.data.email === user?.email ? "white" : "#1976d2",
                        textDecoration: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {renderFileIcon(msg.data.text, msg.data.fileName || "")}
                      <Typography variant="body2" style={{ marginTop: "8px" }}>
                        {msg.data.fileName || "Download file"}
                      </Typography>
                    </a>
                  </div>
                ) : (
                  <Typography>{msg.data.text}</Typography>
                )}
              </div>
              <Typography
                variant="caption"
                style={{
                  alignSelf:
                    msg.data.email === user?.email ? "flex-end" : "flex-start",
                  marginTop: "4px",
                  opacity: 0.7,
                }}
              >
                {formatTime(msg.data.timestamp)}
              </Typography>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
 
      {/* Input Section */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "white",
        }}
      >
        {/* Text message input */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            style={{ alignSelf: "flex-end" }}
          >
            <Send />
          </IconButton>
        </div>
 
        {/* File upload section */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<Attachment />}
              size="small"
            >
              Select File
            </Button>
          </label>
 
          <Typography variant="body2" style={{ flex: 1 }}>
            {selectedFile ? selectedFile.name : "No file selected"}
          </Typography>
 
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile}
            size="small"
          >
            Upload
          </Button>
        </div>
 
        {/* Error and progress indicators */}
        {error && (
          <Typography color="error" style={{ marginTop: "8px" }}>
            {error}
          </Typography>
        )}
 
        {progress !== null && (
          <div style={{ marginTop: "8px" }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography
              variant="body2"
              style={{ textAlign: "center", marginTop: "4px" }}
            >
              {Math.round(progress)}% complete
            </Typography>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};
 
export default Chat;