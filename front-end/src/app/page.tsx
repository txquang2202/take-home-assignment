"use client";
import React, { useState, useEffect } from "react";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import { UploadProps } from "antd";
import ImagePreviewModal from "../components/imagePreviewModal";
import ImageList from "../components/imageList";
import ImageUpload from "../components/ImageUpload";
import axios from "axios";

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const Page = () => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageList, setImageList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/images");
        const images = response.data.map((image: any) => ({
          uid: image.id,
          name: image.name,
          status: "done",
          url: image.url,
        }));

        setImageList(images);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

  const handleCancel = () => setPreviewVisible(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewVisible(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const handleAddImages = async () => {
    const newImageList = await Promise.all(
      fileList.map(async (file) => {
        if (!file.url && !file.preview) {
          file.preview = await getBase64(file.originFileObj as RcFile);
        }
        return file;
      })
    );
    setImageList([...imageList, ...newImageList]);
    setFileList([]);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        padding: "10px",
      }}
    >
      <ImageList imageList={imageList} />
      <ImageUpload
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        onAddImages={handleAddImages}
      />
      <ImagePreviewModal
        visible={previewVisible}
        image={previewImage}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default Page;