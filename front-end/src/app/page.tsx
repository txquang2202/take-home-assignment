"use client";
import React, { useState, useEffect } from "react";
import type {
  UploadFile,
  RcFile,
  UploadFileStatus,
} from "antd/es/upload/interface";
import { UploadProps } from "antd";
import ImagePreviewModal from "../components/imagePreviewModal";
import ImageList from "../components/imageList";
import ImageUpload from "../components/ImageUpload";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
interface CustomUploadFile extends UploadFile {
  comment?: string;
  status: UploadFileStatus;
}

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
  const [imageList, setImageList] = useState<CustomUploadFile[]>([]);
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACK_END_API_URL}/api/images`
        );
        const images = response.data.map((image: any) => ({
          uid: image.id,
          name: image.name,
          status: "done",
          url: image.url,
        }));

        const imagesWithComments = await Promise.all(
          images.map(async (image: any) => {
            const commentsResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_BACK_END_API_URL}/api/images/${image.uid}/comment`
            );
            const comments = commentsResponse.data;
            const comment = comments.length > 0 ? comments[0].content : "";
            return {
              ...image,
              comment: comment,
            };
          })
        );
        setImageList(imagesWithComments);
        // console.log(imagesWithComments);
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

  const handleAddImages = async (uploadedImages: any | any[]) => {
    let newImageList: CustomUploadFile[];

    const createImageObject = (image: any) => ({
      uid: image.id,
      name: image.name,
      status: "done" as UploadFileStatus,
      url: image.url.startsWith("http")
        ? image.url
        : `${process.env.NEXT_PUBLIC_BACK_END_API_URL}${image.url}`,
      comment: "",
    });

    if (Array.isArray(uploadedImages)) {
      newImageList = uploadedImages.map(createImageObject);
    } else if (uploadedImages && typeof uploadedImages === "object") {
      newImageList = [createImageObject(uploadedImages)];
    } else {
      console.error("Unexpected format for uploadedImages:", uploadedImages);
      return;
    }

    setImageList((prevList) => [...prevList, ...newImageList]);
    setFileList([]);
  };
  const handleAddComment = async (image: CustomUploadFile, comment: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACK_END_API_URL}/api/images/${image.uid}/comment`,
        {
          comment,
        }
      );

      setImageList((prevList) =>
        prevList.map((img) =>
          img.uid === image.uid ? { ...img, comment } : img
        )
      );
    } catch (error) {
      console.error("Error adding comment:", error);
    }
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
      <ImageList imageList={imageList} onAddComment={handleAddComment} />
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
