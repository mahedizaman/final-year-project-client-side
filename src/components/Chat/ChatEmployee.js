import {
  doc,
  setDoc,
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
import pdfFileImage from "../../assets/images/file-type/pdf file.png";
import docFileImage from "../../assets/images/file-type/doc icon.png";
import docxFileImage from "../../assets/images/file-type/docx icon.png";
import {
  chatApp,
  employeeAuth,
  publicUserAuth,
  publicUserStorage,
} from "../../firebase.config";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { LinearProgress, Typography } from "@mui/material";

const db = getFirestore(chatApp);

const ChatEmployee = () => {
  const [user] = useAuthState(employeeAuth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [publicUser, setPublicUser] = useState();
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [progress, setProgress] = useState();
  const { id } = useParams();
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    axios
      .get(`http://localhost:8080/public-user/find-by/${id}`)
      .then((data) => setPublicUser(data.data))
      .catch((err) => console.log(err));
  }, [id]);

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

  useEffect(() => {
    setFilteredMessages(
      messages.filter(
        (message) =>
          (message.data.receiverEmail === publicUser?.email &&
            message.data.email === user?.email) ||
          (message.data.receiverEmail === user?.email &&
            message.data.email === publicUser?.email)
      )
    );
  }, [messages, user, publicUser]);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [selectedFile, setSelectedFile] = useState();
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleUpload = () => {
    const size = selectedFile?.size / 1000000;
    if (size <= 100) {
      if (error) {
        setError(null);
      }
      const storageRef = ref(
        publicUserStorage,
        `client/${user?.email}/` +
          selectedFile?.name?.split(".")[0] +
          "-" +
          uuidv4() +
          "-" +
          `${
            (selectedFile?.name?.split(".")?.[1] == "pdf" && "pdf") ||
            (selectedFile?.name?.split(".")?.[1] == "doc" && "doc.doc") ||
            (selectedFile?.name?.split(".")?.[1] == "docx" && "docx.docx") ||
            (selectedFile?.name?.split(".")?.[1] == "jpeg" && "jpeg") ||
            (selectedFile?.name?.split(".")?.[1] == "png" && "png") ||
            (selectedFile?.name?.split(".")?.[1] == "jpg" && "jpg")
          }`
      );

      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => {
          // Handle error
        },
        async () => {
          await getDownloadURL(uploadTask.snapshot.ref).then(
            async (downloadURL) => {
              await addDoc(collection(db, "messages"), {
                email: user?.email,
                photoURL: user?.photoURL,
                displayName: user?.displayName,
                text: downloadURL,
                timestamp: serverTimestamp(),
                receiverEmail: publicUser?.email,
              });
              setSelectedFile(null);
              fileInputRef.current.value = "";
              setProgress(null);
            }
          );
        }
      );
    } else {
      setError("File Size Can Not Exceed 100MB");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await addDoc(collection(db, "messages"), {
      email: user?.email,
      photoURL: user?.photoURL,
      displayName: user?.displayName,
      text: newMessage,
      timestamp: serverTimestamp(),
      receiverEmail: publicUser?.email,
    });
    setNewMessage("");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex flex-col">
      {/* Header - Opponent's Name */}
      <div className="bg-white shadow-sm border-b border-gray-200 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
              {publicUser?.name?.charAt(0) || publicUser?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {publicUser?.name || publicUser?.email || 'User'}
              </h1>
              <p className="text-green-600 text-sm">Online</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Chatting as: <span className="font-medium text-blue-600">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-transparent">
        <div className="max-w-4xl mx-auto space-y-3">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.data.email === user?.email ? "justify-end" : "justify-start"}`}
            >
              {/* Opponent's Message - Left Side - Green */}
              {msg.data.email !== user?.email && (
                <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                    {msg.data.displayName?.charAt(0) || msg.data.email?.charAt(0) || 'U'}
                  </div>
                  <div className="bg-green-500 text-white rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
                    {/* Text Message */}
                    {!msg.data.text?.includes("https") && (
                      <p className="break-words">{msg.data.text}</p>
                    )}
                    
                    {/* File Messages */}
                    {msg.data.text?.includes("https") && (
                      <div>
                        {msg.data.text?.includes("pdf") && (
                          <a href={msg.data.text} target="_blank" rel="noreferrer" className="block hover:opacity-80">
                            <img src={pdfFileImage} alt="PDF" className="w-10 h-10 mx-auto mb-1" />
                            <p className="text-xs text-center">View PDF</p>
                          </a>
                        )}
                        {msg.data.text?.includes("doc") && !msg.data.text?.includes("docx") && (
                          <a href={msg.data.text} target="_blank" rel="noreferrer" className="block hover:opacity-80">
                            <img src={docFileImage} alt="DOC" className="w-10 h-10 mx-auto mb-1" />
                            <p className="text-xs text-center">Download</p>
                          </a>
                        )}
                        {msg.data.text?.includes("docx") && (
                          <a href={msg.data.text} target="_blank" rel="noreferrer" className="block hover:opacity-80">
                            <img src={docxFileImage} alt="DOCX" className="w-10 h-10 mx-auto mb-1" />
                            <p className="text-xs text-center">Download</p>
                          </a>
                        )}
                        {(msg.data.text?.includes("jpeg") || 
                          msg.data.text?.includes("jpg") || 
                          msg.data.text?.includes("png")) && (
                          <img 
                            src={msg.data.text} 
                            alt="Shared" 
                            className="max-w-full h-auto rounded-lg max-h-40"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* My Message - Right Side - Blue */}
              {msg.data.email === user?.email && (
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md max-w-xs lg:max-w-md ml-auto">
                  {/* Text Message */}
                  {!msg.data.text?.includes("https") && (
                    <p className="break-words">{msg.data.text}</p>
                  )}
                  
                  {/* File Messages */}
                  {msg.data.text?.includes("https") && (
                    <div>
                      {msg.data.text?.includes("pdf") && (
                        <a href={msg.data.text} target="_blank" rel="noreferrer" className="block hover:opacity-80">
                          <img src={pdfFileImage} alt="PDF" className="w-10 h-10 mx-auto mb-1" />
                          <p className="text-xs text-center">View PDF</p>
                        </a>
                      )}
                      {msg.data.text?.includes("doc") && !msg.data.text?.includes("docx") && (
                        <a href={msg.data.text} target="_blank" rel="noreferrer" className="block hover:opacity-80">
                          <img src={docFileImage} alt="DOC" className="w-10 h-10 mx-auto mb-1" />
                          <p className="text-xs text-center">Download</p>
                        </a>
                      )}
                      {msg.data.text?.includes("docx") && (
                        <a href={msg.data.text} target="_blank" rel="noreferrer" className="block hover:opacity-80">
                          <img src={docxFileImage} alt="DOCX" className="w-10 h-10 mx-auto mb-1" />
                          <p className="text-xs text-center">Download</p>
                        </a>
                      )}
                      {(msg.data.text?.includes("jpeg") || 
                        msg.data.text?.includes("jpg") || 
                        msg.data.text?.includes("png")) && (
                        <img 
                          src={msg.data.text} 
                          alt="Shared" 
                          className="max-w-full h-auto rounded-lg max-h-40"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* File Upload Section */}
          <div className="mb-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : undefined;
                setSelectedFile(file);
              }}
              className="hidden"
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                📎 Attach File
              </button>
              
              {selectedFile && (
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-sm text-gray-600 truncate flex-1">
                    {selectedFile.name}
                  </span>
                  <button 
                    onClick={handleUpload}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Upload
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {progress !== null && progress !== undefined && (
              <div className="mt-2">
                <LinearProgress variant="determinate" value={progress} />
                <p className="text-xs text-gray-500 text-center mt-1">
                  Uploading: {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                <Typography sx={{ color: "red" }} className="text-sm">
                  {error}
                </Typography>
              </div>
            )}
          </div>

          {/* Text Input Section */}
          <div className="flex space-x-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatEmployee;