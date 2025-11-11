import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Alert,
  LinearProgress,
  Typography,
  Button,
  Box,
  Paper,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircleOutline,
  DangerousOutlined,
  CloudUpload,
  InsertDriveFile,
} from "@mui/icons-material";
import { useAuthState } from "react-firebase-hooks/auth";
import { publicUserAuth } from "../../../firebase.config";
import axios from "axios";

const PublicUserUploadFile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [user] = useAuthState(publicUserAuth);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successStatus, setSuccessStatus] = useState("");
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Cloudinary configuration
  const cloudName = "dbu0vvew7";
  const uploadPreset ="custom";

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    const size = selectedFile.size / 1000000; // Convert to MB
    if (size > 100) {
      setError("File Size Can Not Exceed 100MB");
      return;
    }

    if (!cloudName || !uploadPreset) {
      setError("Cloudinary configuration missing");
      return;
    }

    // Reset states
    setError(null);
    setSuccessStatus("");
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);
      formData.append("cloud_name", cloudName);
      
      // Add folder structure similar to Firebase
      const folderPath = `client/${user?.email}`;
      formData.append("folder", folderPath);
      
      // Add unique identifier
      const publicId = `${selectedFile.name}-${uuidv4()}`;
      formData.append("public_id", publicId);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setProgress(percentCompleted);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUrl(response.secure_url);
          console.log(response.secure_url)
          setSuccessStatus("Successful");
          await axios
                .post("http://localhost:8080/upload-file", {
                  file: response.secure_url,
                  type: selectedFile?.type,
                  uploadedBy: user?.email,
                  // location: location,
                  fileName: selectedFile?.name,
                })
          console.log("File uploaded successfully:", response);
        } else {
          setError("Upload failed. Please try again.");
          setSuccessStatus("Failed");
        }
        setIsUploading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Upload failed. Please check your connection and try again.");
        setSuccessStatus("Failed");
        setIsUploading(false);
      });

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
      xhr.send(formData);

    } catch (err) {
      setError("An unexpected error occurred");
      setSuccessStatus("Failed");
      setIsUploading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setSelectedFile(file);
      setSuccessStatus("");
      setProgress(0);
      setError(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: "auto", mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload File to Cloudinary
      </Typography>

      <Box sx={{ mb: 2 }}>
        <input
          accept="*/*"
          style={{ display: "none" }}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            fullWidth
            sx={{ mb: 2 }}
          >
            Choose File
          </Button>
        </label>

        {selectedFile && (
          <Box sx={{ mt: 1, p: 1, border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InsertDriveFile color="action" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" noWrap>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
              <Chip 
                label={selectedFile.type || "Unknown type"} 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        fullWidth
        sx={{ mb: 2 }}
        startIcon={isUploading ? <CircularProgress size={16} /> : null}
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successStatus && (
        <Alert
          icon={
            successStatus === "Successful" ? (
              <CheckCircleOutline fontSize="inherit" />
            ) : (
              <DangerousOutlined />
            )
          }
          severity={successStatus === "Successful" ? "success" : "error"}
          sx={{ mb: 2 }}
        >
          {successStatus === "Successful" ? (
            <Box>
              <Typography variant="body2">
                File uploaded successfully!
              </Typography>
              {url && (
                <Button
                  variant="text"
                  size="small"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 1 }}
                >
                  View File
                </Button>
              )}
            </Box>
          ) : (
            "Could not upload file"
          )}
        </Alert>
      )}

      {isUploading && progress > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upload Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
    </Paper>
  );
};

export default PublicUserUploadFile;