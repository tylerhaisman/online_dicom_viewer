"use client";

import Image from "next/image";
import Link from "next/link";
import Arrow from "../public/icons/arrow.svg";
import Github from "../public/icons/github-svgrepo-com.svg";
import Info from "../public/icons/info-circle-svgrepo-com.svg";
import ImageIcon from "../public/icons/upload-minimalistic-svgrepo-com (1).svg";
import Check from "../public/icons/check-circle-svgrepo-com (1).svg";
import Start from "../public/icons/start-favorite-svgrepo-com.svg";
import Lungs from "../public/icons/lungs-lung-svgrepo-com.svg";
import Plus from "../public/icons/plus-large-svgrepo-com (1).svg";
import Donut from "../public/icons/circle-dashed-svgrepo-com.svg";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import dicomParser from "dicom-parser";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import { initializeCornerstone } from "./cornerstone_init";

initializeCornerstone();

//so i can accept directories
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
    mozdirectory?: string;
  }
}

export default function Home() {
  const router = useRouter();
  const [imageData, setImageData] = useState<FormData | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [draggedOver, setDraggedOver] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);

  const handleClearValues = async () => {
    setImageData(null);
    setImageFileName("");
    setPreview("");
    setDraggedOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDraggedOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDraggedOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    const data = new FormData();
    data.append("image", file);
    setImageFileName(file.name);
    setImageData(data);
    setDraggedOver(false);
  };

  const [dicomImages, setDicomImages] = useState<any[]>([]);
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
  const canvasRefs = useRef<HTMLDivElement[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlIndex, setImageUrlIndex] = useState(0);

  useEffect(() => {
    const handleWheel = (event: any) => {
      console.log(imageUrlIndex);
      if (event.deltaY > 0) {
        //going up
        if (imageUrlIndex < imageUrls.length - 1) {
          console.log("increase");
          setImageUrlIndex(imageUrlIndex + 1);
        }
      }
      //going down
      else {
        if (imageUrlIndex > 0) {
          console.log("decrease");
          setImageUrlIndex(imageUrlIndex - 1);
        }
      }
    };

    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [imageUrls, imageUrlIndex]);

  const convertDicomToImageUrl = async (file: File): Promise<string> => {
    const fileUrl = URL.createObjectURL(file);
    const image = await cornerstone.loadImage(`wadouri:${fileUrl}`);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
      canvas.width = image.width;
      canvas.height = image.height;
      cornerstone.renderToCanvas(canvas, image);

      // Convert the canvas to a data URL (base64 string)
      const imageUrl = canvas.toDataURL("image/jpeg"); // or 'image/png'
      return imageUrl;
    }

    throw new Error("Failed to create canvas context");
  };

  useEffect(() => {
    const loadAndConvertImages = async () => {
      const urls = await Promise.all(dicomImages.map(convertDicomToImageUrl));
      setImageUrls(urls);
    };

    if (dicomImages.length > 0) {
      loadAndConvertImages();
    }
  }, [dicomImages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setDicomImages(Array.from(event.target.files));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white w-full px-4">
      <Toaster position="top-right"></Toaster>
      <div className="m-auto">
        <div className="py-4 flex justify-between">
          <div
            className="flex gap-2 items-center cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image src={Donut} alt="Donut" className="w-12 h-12"></Image>
            <div className="">
              <p>Free Online</p>
              <h2>DICOM File Viewer</h2>
            </div>
          </div>
          <div className="flex gap-1 justify-center items-center relative">
            {showInfoMenu && (
              <motion.div
                className="absolute right-0 top-12 bg-white/10 border border-white/10 shadow-sm rounded-md w-max overflow-hidden backdrop-blur-xl"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0, ease: "backOut" }}
                exit={{ opacity: 0, y: -30 }}
              >
                <p className="p-3 hover:bg-white/10 cursor-pointer">
                  <Link href={"/termsofuse"} target="_blank">
                    Terms of Use
                  </Link>
                </p>
                <hr className="border-white/10 bg-white/10" />
                <p className="p-3 hover:bg-white/10 cursor-pointer">
                  <Link href={"/privacypolicy"} target="_blank">
                    Privacy Policy
                  </Link>
                </p>
              </motion.div>
            )}
            <button
              className="bg-white/10 border border-white/10 shadow-sm p-2 rounded-md flex gap-2 justify-center items-center"
              onClick={() => {
                window.open("https://github.com", "_blank");
              }}
            >
              <Image src={Github} alt="Github" className="w-4 h-4"></Image>
            </button>
            <button
              className="bg-white/10 border border-white/10 shadow-sm p-2 rounded-md flex gap-2 justify-center items-center"
              onClick={() => {
                setShowInfoMenu(!showInfoMenu);
              }}
            >
              <Image src={Info} alt="Github" className="w-4 h-4"></Image>
            </button>
          </div>
        </div>
        <hr className="h-0 border-t border-white/10" />
        <AnimatePresence>
          {imageUrls.length == 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0, ease: "backOut" }}
              className="pt-4 absolute left-4 right-4 top-20 bottom-4 flex flex-col"
            >
              <div className="">
                <h1>Upload your DICOM directory here:</h1>
                <p className="mt-2">
                  The file must be a directory containing only one or more files
                  in{" "}
                  <span className="px-2 py-1 font-normal bg-white/10 rounded-md border border-white/10">
                    .DCM
                  </span>{" "}
                  format.
                </p>
              </div>
              <motion.label
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
                className={
                  draggedOver
                    ? "bg-white/20 duration-100 px-4 py-16 rounded-md border border-dashed border-white/10 mt-6 flex flex-col justify-center items-center text-center cursor-pointer flex-1"
                    : "bg-white/10 hover:bg-white/20 duration-100 px-4 py-16 rounded-md border border-dashed border-white/10 mt-6 flex flex-col justify-center items-center text-center cursor-pointer flex-1"
                }
                htmlFor="fileInput"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!imageFileName && !imageData && (
                  <div className="flex flex-col justify-center items-center text-center">
                    <Image
                      src={ImageIcon}
                      alt=""
                      className={
                        draggedOver
                          ? "w-16 h-16 duration-200 -mt-2 mb-2"
                          : "w-16 h-16 duration-200"
                      }
                    ></Image>
                    <div className="flex gap-1 mt-6">
                      <h2 className="">Click to upload</h2> or drag and drop
                    </div>
                    <p className="text-white/60">
                      Supports: A directory only containing one or more .DCM
                      files
                    </p>
                  </div>
                )}
                {imageFileName && imageData && (
                  <div className="flex flex-col justify-center items-center text-center">
                    <div className="relative">
                      <motion.div
                        className=""
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0,
                          ease: "backOut",
                        }}
                      >
                        <Image
                          src={Check}
                          alt=""
                          className="w-10 h-10 absolute bg-slate-50 rounded-full p-1 -right-4 -top-4 shadow-md z-20"
                        ></Image>
                      </motion.div>
                      <motion.div
                        className=""
                        initial={{ opacity: 0, y: 30, z: 1 }}
                        animate={{ opacity: 1, y: 0, z: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: 0,
                          ease: "backOut",
                        }}
                      >
                        {/* <Image
                            src={preview}
                            alt="Preview"
                            width="0"
                            height="0"
                            className="w-24 max-h-24 rounded-md shadow-md relative z-10"
                          ></Image> */}
                      </motion.div>
                    </div>
                    <div className="flex gap-1 mt-6">
                      <h2 className="font-black">Directory uploaded:</h2>
                      {imageFileName}
                    </div>
                    <p className="text-black/30">
                      Press the "View DICOM Images" button to continue.
                    </p>
                  </div>
                )}
              </motion.label>
              <input
                type="file"
                // accept=""
                onChange={handleFileChange}
                id="fileInput"
                className="hidden"
                // directory=""
                // webkitdirectory=""
                // mozdirectory=""
                multiple
              />
              {imageData && imageFileName && (
                <div className="flex gap-3">
                  <motion.button
                    className="mt-6 bg-cyan-700 px-4 py-3 rounded-md text-slate-50 flex justify-center items-center backdrop-blur-lg duration-200"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0,
                      ease: "backOut",
                    }}
                  >
                    View DICOM Images{" "}
                    <div className=" arrow flex items-center justify-center">
                      <div className="arrowMiddle"></div>
                      <div>
                        <Image
                          src={Arrow}
                          alt=""
                          width={14}
                          height={14}
                          className="arrowSide"
                        ></Image>
                      </div>
                    </div>
                  </motion.button>
                  <motion.button
                    className="mt-6 bg-slate-50 px-4 py-3 rounded-md flex justify-center items-center backdrop-blur-lg duration-200 border border-white/10"
                    onClick={() => handleClearValues()}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.2,
                      ease: "backOut",
                    }}
                  >
                    Cancel
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {imageUrls.length != 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0, ease: "backOut" }}
              className="pt-4 absolute left-4 right-4 top-20 bottom-4 flex flex-col"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
                className={
                  "duration-100 rounded-md border border-dashed border-white/10 flex flex-col justify-center items-center text-center flex-1 relative overflow-y-auto"
                }
              >
                <img
                  src={imageUrls.at(imageUrlIndex)}
                  alt={`DICOM ${imageUrlIndex}`}
                  className="flex-1"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
