"use client";

import Image from "next/image";
import Link from "next/link";

import Arrow from "../public/icons/arrow.svg";
import Github from "../public/icons/github-svgrepo-com.svg";
import Info from "../public/icons/info-circle-svgrepo-com.svg";
import ImageIcon from "../public/icons/upload-minimalistic-svgrepo-com (1).svg";
import Check from "../public/icons/check-circle-svgrepo-com (1).svg";
import Donut from "../public/icons/circle-dashed-svgrepo-com.svg";
import Contrast from "../public/icons/contrast-908-svgrepo-com.svg";
import Cursor from "../public/icons/cursor-svgrepo-com.svg";
import Crosshair from "../public/icons/crosshair-simple-svgrepo-com.svg";
import ZoomIn from "../public/icons/zoom-in-1462-svgrepo-com.svg";
import ZoomOut from "../public/icons/zoom-out-1460-svgrepo-com.svg";
import JoystickIcon from "../public/icons/joystick-svgrepo-com.svg";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import dicomParser from "dicom-parser";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import { initializeCornerstone } from "./cornerstone_init";
import { useLongPress } from "use-long-press";
import { Joystick } from "react-joystick-component";

// declare module "react" {
//   interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
//     directory?: string;
//     webkitdirectory?: string;
//     mozdirectory?: string;
//   }
// }

interface ImageUrlsInterface {
  axialUrl: string;
  pixelSpacing: Array<Number>;
  widthMM: Number;
  heightMM: Number;
  widthPX: Number;
  heightPX: Number;
}

interface DotInterface {
  x: number;
  y: number;
  xMM: number;
  yMM: number;
}

export default function Home() {
  initializeCornerstone();
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
  const router = useRouter();

  const [preview, setPreview] = useState("");
  const [draggedOver, setDraggedOver] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [dicomImages, setDicomImages] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<ImageUrlsInterface[]>([]);
  const [imageUrlIndex, setImageUrlIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [dicomLoading, setDicomLoading] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [contrastValue, setContrastValue] = useState(100);
  const [cursor, setCursor] = useState("cursor");
  const [zoom, setZoom] = useState(1);
  const [xScale, setXScale] = useState(0);
  const [yScale, setYScale] = useState(0);
  const [imageIsHovered, setImageIsHovered] = useState(false);
  const [joystickX, setJoystickX] = useState(0);
  const [joystickY, setJoystickY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [dots, setDots] = useState<Array<DotInterface>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showJoystick, setShowJoystick] = useState(false);
  const [xCoordinate, setXCoordinate] = useState(0);
  const [yCoordinate, setYCoordinate] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(null);
  const [longPressInterval, setLongPressInterval] =
    useState<NodeJS.Timeout | null>(null);

  const handleClearValues = async () => {
    setPreview("");
    setDraggedOver(false);
    setImageUrls([]);
    setImageUrlIndex(0);
    setDicomImages([]);
    setReady(false);
    setShowImages(false);
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
    const files = e.dataTransfer.files;

    if (files.length > 0) {
      setDicomLoading(true);
      setDraggedOver(false);
      setDicomImages(Array.from(files));
    } else {
      setDraggedOver(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setDicomLoading(true);
      setDicomImages(Array.from(event.target.files));
    }
  };

  useEffect(() => {
    const loadAndConvertImages = async () => {
      const sortedFiles = dicomImages
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      const urls = await Promise.all(sortedFiles.map(convertDicomToImageUrl));
      setImageUrls(urls);
      setPreview(urls[0].axialUrl);
      setReady(true);
      setDicomLoading(false);
    };

    if (dicomImages.length > 0) {
      loadAndConvertImages();
    }
  }, [dicomImages]);

  useEffect(() => {
    const handleWheel = (event: any) => {
      console.log(canScroll);
      if (canScroll) {
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
      }
    };

    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [canScroll, imageUrls, imageUrlIndex]);

  const convertDicomToImageUrl = async (
    file: File
  ): Promise<ImageUrlsInterface> => {
    const fileUrl = URL.createObjectURL(file);
    const image = await cornerstone.loadImage(`wadouri:${fileUrl}`);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
      canvas.width = image.width;
      canvas.height = image.height;
      cornerstone.renderToCanvas(canvas, image);

      const axialUrl = canvas.toDataURL("image/jpeg");

      const pixelSpacing = image.data.string("x00280030")
        ? image.data.string("x00280030").split("\\").map(Number)
        : [1, 1];

      const widthMM = image.width * pixelSpacing[1];
      const heightMM = image.height * pixelSpacing[0];

      return {
        axialUrl,
        pixelSpacing,
        widthMM,
        heightMM,
        widthPX: image.width,
        heightPX: image.height,
      };
    }

    throw new Error("Failed to create canvas context");
  };

  const incrementIndex = useCallback(() => {
    setImageUrlIndex((prevIndex) =>
      prevIndex < imageUrls.length - 1 ? prevIndex + 1 : prevIndex
    );
  }, [imageUrls.length]);

  const decrementIndex = useCallback(() => {
    setImageUrlIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  }, [imageUrls.length]);

  const handleLongPressStartDec = useCallback(() => {
    decrementIndex();
    const intervalId = setInterval(decrementIndex, 40);
    setLongPressInterval(intervalId);
  }, [incrementIndex]);

  const handleLongPressEndDec = useCallback(() => {
    if (longPressInterval) {
      clearInterval(longPressInterval);
      setLongPressInterval(null);
    }
  }, [longPressInterval]);

  const handleLongPressStartInc = useCallback(() => {
    incrementIndex();
    const intervalId = setInterval(incrementIndex, 40);
    setLongPressInterval(intervalId);
  }, [incrementIndex]);

  const handleLongPressEndInc = useCallback(() => {
    if (longPressInterval) {
      clearInterval(longPressInterval);
      setLongPressInterval(null);
    }
  }, [longPressInterval]);

  const bindInc = useLongPress(handleLongPressStartInc, {
    onFinish: handleLongPressEndInc,
    onCancel: handleLongPressEndInc,
    threshold: 100,
  });

  const bindDec = useLongPress(handleLongPressStartDec, {
    onFinish: handleLongPressEndDec,
    onCancel: handleLongPressEndDec,
    threshold: 100,
  });

  const handleMouseDown = (event: any) => {
    setIsDragging(true);
    startYRef.current = event.clientY;
  };

  const handleMouseMove = (event: any) => {
    if (
      isDragging &&
      startYRef.current !== null &&
      joystickX == 0 &&
      joystickY == 0 &&
      cursor == "cursor"
    ) {
      const deltaY = event.clientY - startYRef.current;

      if (deltaY < -0.1) {
        setImageUrlIndex((prevIndex) =>
          Math.min(prevIndex + 1, imageUrls.length - 1)
        );
        startYRef.current = event.clientY;
      } else if (deltaY > 0.1) {
        setImageUrlIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        startYRef.current = event.clientY;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    startYRef.current = null;
  };

  const handleMouseMoveImage = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const actualWidth = Number(imageUrls[imageUrlIndex].widthPX);
    const actualHeight = Number(imageUrls[imageUrlIndex].heightPX);

    const displayedWidth = rect.width;
    const displayedHeight = rect.height;

    const scaleX = actualWidth / displayedWidth;
    const scaleY = actualHeight / displayedHeight;

    setXScale(scaleX);
    setYScale(scaleY);

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let x = mouseX * scaleX;
    let y = mouseY * scaleY;

    if (x < 0) {
      x = 0;
    }
    if (y < 0) {
      y = 0;
    }
    if (x > actualWidth) {
      x = actualWidth;
    }
    if (y > actualHeight) {
      y = actualHeight;
    }

    setXCoordinate(x);
    setYCoordinate(y);
  };

  const handleImageClick = (event: any) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newDot = {
      x,
      y,
      xMM: xCoordinate * Number(imageUrls[imageUrlIndex].pixelSpacing[1]),
      yMM: yCoordinate * Number(imageUrls[imageUrlIndex].pixelSpacing[0]),
    };

    if (!isDrawing) {
      setIsDrawing(true);
      setDots([newDot]);
    } else {
      setIsDrawing(false);
      setDots((prevDots) => [...prevDots, newDot]);
    }
  };

  const calculateDistance = (dot1: DotInterface, dot2: DotInterface) => {
    const deltaX =
      (dot2.x - dot1.x) *
      xScale *
      Number(imageUrls[imageUrlIndex].pixelSpacing[1]);
    const deltaX2 = deltaX * deltaX;
    const deltaY =
      (dot2.y - dot1.y) *
      yScale *
      Number(imageUrls[imageUrlIndex].pixelSpacing[0]);
    const deltaY2 = deltaY * deltaY;
    return Math.sqrt(deltaX2 + deltaY2);
  };

  const handleMove = (event: any) => {
    if (event.x !== null && event.y !== null) {
      setJoystickX(event.x);
      setJoystickY(event.y);
    }
  };

  useEffect(() => {
    const speed = 2;
    setTranslateX(translateX - joystickX * speed);
    setTranslateY(translateY + joystickY * speed);
  }, [joystickX, joystickY]);

  return (
    <div className="min-h-screen bg-black text-white w-full px-4">
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
                className="absolute right-0 top-12 bg-white/10 border border-white/20 shadow-sm rounded-md w-max overflow-hidden backdrop-blur-xl z-50"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0, ease: "backOut" }}
                exit={{ opacity: 0, y: -30 }}
              >
                <p className="p-3 hover:bg-white/10 cursor-pointer">
                  <Link
                    href={"https://tylerhaisman.com/#contact"}
                    target="_blank"
                  >
                    Contact Me
                  </Link>
                </p>
                <hr className="border-white/20 bg-white/10" />
                <p className="p-3 hover:bg-white/10 cursor-pointer">
                  <Link href={"https://tylerhaisman.com"} target="_blank">
                    Project Docs
                  </Link>
                </p>
              </motion.div>
            )}
            <button
              className="bg-white/10 border border-white/20 shadow-sm p-2 rounded-md flex gap-2 justify-center items-center"
              onClick={() => {
                window.open(
                  "https://github.com/tylerhaisman/online_dicom_viewer",
                  "_blank"
                );
              }}
            >
              <Image src={Github} alt="Github" className="w-4 h-4"></Image>
            </button>
            <button
              className="bg-white/10 border border-white/20 shadow-sm p-2 rounded-md flex gap-2 justify-center items-center"
              onClick={() => {
                setShowInfoMenu(!showInfoMenu);
              }}
            >
              <Image src={Info} alt="Github" className="w-4 h-4"></Image>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {!showImages && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0, ease: "backOut" }}
              className="mt-4 pt-4 absolute left-4 right-4 top-16 bottom-4 flex flex-col border-t border-white/20"
            >
              <div className="">
                <h1>Upload your DICOM file(s) here:</h1>
                <p className="mt-2">
                  The upload must be one or more files in{" "}
                  <span className="px-2 py-1 font-normal bg-white/10 rounded-md border border-white/20">
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
                    ? "bg-white/20 duration-100 px-4 py-16 rounded-md border border-dashed border-white/20 mt-4 flex flex-col justify-center items-center text-center cursor-pointer flex-1"
                    : "bg-white/10 duration-100 px-4 py-16 rounded-md border border-dashed border-white/20 mt-4 flex flex-col justify-center items-center text-center cursor-pointer flex-1"
                }
                htmlFor="fileInput"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {ready == false && !dicomLoading && (
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
                    <div className="flex gap-1 mt-4">
                      <h2 className="">Click to upload</h2> or drag and drop
                    </div>
                    <p className="text-white/60">
                      Supports: An upload only containing one or more .DCM files
                    </p>
                  </div>
                )}
                {ready == false && dicomLoading && (
                  <div className="flex flex-col justify-center items-center text-center">
                    <div className="relative">
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
                        <div className="lds-ring mb-4">
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      </motion.div>
                    </div>
                    <p>Loading DICOM files...</p>
                  </div>
                )}
                {ready == true && !dicomLoading && (
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
                          className="w-10 h-10 absolute bg-white/10 border border-white/20 rounded-full p-1 -right-4 -top-4 shadow-md z-20 backdrop-blur-lg"
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
                        <Image
                          src={preview}
                          alt="Preview"
                          width="0"
                          height="0"
                          className="w-24 max-h-24 rounded-md shadow-md relative z-10 border border-white/20"
                        ></Image>
                      </motion.div>
                    </div>
                    <div className="flex gap-1 mt-4">
                      <h2 className="">DICOM files uploaded.</h2>
                    </div>
                    <p className="text-white/60">
                      Press the "View DICOM Images" button to continue.
                    </p>
                  </div>
                )}
              </motion.label>
              <input
                type="file"
                accept=".dcm"
                onChange={handleFileChange}
                id="fileInput"
                className="hidden"
                multiple
                // directory=""
                // webkitdirectory=""
                // mozdirectory=""
              />

              {ready == true && (
                <div className="flex gap-3">
                  <motion.button
                    className="mt-4 bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white flex justify-center items-center backdrop-blur-lg duration-200"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0,
                      ease: "backOut",
                    }}
                    onClick={() => {
                      setShowImages(true);
                      setImageUrlIndex(0);
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
                    className="mt-4 hover:bg-white/10 hover:border border-white/20 px-4 py-3 rounded-md text-white flex justify-center items-center backdrop-blur-lg duration-200"
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
          {showImages && imageUrls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0, ease: "backOut" }}
              className="pt-4 absolute left-4 right-4 top-16 bottom-4 flex flex-col"
            >
              <motion.div className="mb-4 flex gap-2 justify-between items-center font-mono">
                <div className="flex gap-2">
                  <button
                    className={
                      cursor == "cursor"
                        ? "px-2 py-1 bg-white/20 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                        : "px-2 py-1 bg-white/10 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                    }
                    onClick={() => setCursor("cursor")}
                  >
                    <Image
                      src={Cursor}
                      alt="Cursor"
                      className="w-4 h-full"
                    ></Image>
                  </button>
                  <button
                    className={
                      cursor == "crosshair"
                        ? "px-2 py-1 bg-white/20 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                        : "px-2 py-1 bg-white/10 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                    }
                    onClick={() => setCursor("crosshair")}
                  >
                    <Image
                      src={Crosshair}
                      alt="Crosshair"
                      className="w-4 h-full"
                    ></Image>
                  </button>
                  <div className="bg-white/10 border-white/20 border rounded-md flex items-center cursor-pointer h-10 justify-center">
                    <button
                      className="hover:bg-white/10 p-2 h-full"
                      onClick={() => {
                        setZoom(zoom / 1.2);
                        setDots([]);
                      }}
                    >
                      <Image
                        src={ZoomOut}
                        alt="Arrow up"
                        className="w-4 h-full"
                      ></Image>
                    </button>
                    <hr className="h-full w-0 border-r border-white/20" />
                    <button
                      className=" hover:bg-white/10 p-2 h-full"
                      onClick={() => {
                        setZoom(zoom * 1.2);
                        setDots([]);
                      }}
                    >
                      <Image
                        src={ZoomIn}
                        alt="Arrow down"
                        className="w-4 h-full"
                      ></Image>
                    </button>
                  </div>
                  <button className="px-2 py-1 bg-white/10 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2">
                    <Image
                      src={Contrast}
                      alt="Contrast"
                      className="w-4 h-full"
                    ></Image>
                    <div className="flex gap-2 items-center justify-center">
                      <p className="bg-transparent border-b border-white/20">
                        {contrastValue}
                      </p>
                      <div className="flex flex-col-reverse items-center justify-center">
                        <button
                          className=" hover:bg-white/10"
                          onClick={() => setContrastValue(contrastValue - 10)}
                        >
                          <Image
                            src={Arrow}
                            alt="Arrow down"
                            className="rotate-180 w-3 h-full"
                          ></Image>
                        </button>
                        <button
                          className="hover:bg-white/10"
                          onClick={() => setContrastValue(contrastValue + 10)}
                        >
                          <Image
                            src={Arrow}
                            alt="Arrow up"
                            className="w-3 h-full"
                          ></Image>
                        </button>
                      </div>
                    </div>
                  </button>
                  <button
                    className={
                      showJoystick == true
                        ? "px-2 py-1 bg-white/20 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                        : "px-2 py-1 bg-white/10 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                    }
                    onClick={() => setShowJoystick(!showJoystick)}
                  >
                    <Image
                      src={JoystickIcon}
                      alt="JoystickIcon"
                      className="w-4 h-full"
                    ></Image>
                  </button>
                  {dots.length > 0 && (
                    <button
                      className="px-2 py-1 bg-white/10 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                      onClick={() => setDots([])}
                    >
                      Clear points
                    </button>
                  )}
                  {(translateX != 0 || translateY != 0 || zoom != 1) && (
                    <button
                      className="px-2 py-1 bg-white/10 border-white/20 border rounded-md h-10 flex justify-center items-center gap-2 hover:bg-white/20"
                      onClick={() => {
                        setTranslateX(0);
                        setTranslateY(0);
                        setZoom(1);
                      }}
                    >
                      Recenter
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="px-2 py-1 bg-white/10 border-white/20 border rounded-md h-10 flex flex-col justify-center items-center">
                    {imageUrlIndex + 1} / {imageUrls.length}
                  </div>
                  <div className="bg-white/10 border-white/20 border rounded-md flex items-center cursor-pointer h-10 justify-center">
                    <button
                      {...bindDec()}
                      className=" hover:bg-white/10 p-2 h-full"
                      onClick={() => {
                        if (imageUrlIndex > 0) {
                          setImageUrlIndex(imageUrlIndex - 1);
                        }
                      }}
                    >
                      <Image
                        src={Arrow}
                        alt="Arrow down"
                        className="rotate-180 w-3 h-full"
                      ></Image>
                    </button>
                    <hr className="h-full w-0 border-r border-white/20" />
                    <button
                      {...bindInc()}
                      className="hover:bg-white/10 p-2 h-full"
                      onClick={() => {
                        if (imageUrlIndex < imageUrls.length - 1) {
                          setImageUrlIndex(imageUrlIndex + 1);
                        }
                      }}
                    >
                      <Image
                        src={Arrow}
                        alt="Arrow up"
                        className="w-3 h-full"
                      ></Image>
                    </button>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
                className={
                  "bg-black duration-100 rounded-md border border-dashed border-white/20 text-center flex justify-center items-center flex-1 relative overflow-hidden active:cursor-ns-resize text-red-500 text-xs font-mono"
                }
                onClick={(e) => {
                  if (cursor == "crosshair" && imageIsHovered) {
                    handleImageClick(e);
                  }
                }}
                onMouseEnter={() => {
                  console.log("Mouse entered image area");
                  setCanScroll(true);
                }}
                onMouseLeave={() => {
                  console.log("Mouse left image area");
                  setCanScroll(false);
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseOut={handleMouseUp}
              >
                <img
                  src={imageUrls[imageUrlIndex].axialUrl}
                  alt={`DICOM ${imageUrlIndex}`}
                  className={
                    cursor == "crosshair"
                      ? "h-full min-w-fit cursor-crosshair"
                      : "h-full min-w-fit"
                  }
                  draggable="false"
                  onMouseMove={handleMouseMoveImage}
                  style={{
                    filter: `contrast(${contrastValue}%)`,
                    scale: zoom,
                    transform: `translate(${translateX}px, ${translateY}px)`,
                  }}
                  onMouseEnter={() => setImageIsHovered(true)}
                  onMouseLeave={() => setImageIsHovered(false)}
                />
                {showJoystick && (
                  <div className="fixed bottom-16 left-0 right-0 mx-auto z-20 bg-white/20 border border-white/20 rounded-full w-fit backdrop-blur-lg">
                    <Joystick
                      size={100}
                      baseColor="transparent"
                      stickColor="white"
                      move={handleMove}
                      stop={() => {
                        setJoystickX(0);
                        setJoystickY(0);
                      }}
                    ></Joystick>
                  </div>
                )}
                {dots.map((dot, index) => (
                  <div
                    key={index}
                    className={`absolute bg-[#0000ff] text-white z-20 flex justify-center items-center w-4 h-4 rounded-full`}
                    style={{
                      top: dot.y - 8,
                      left: dot.x - 8,
                    }}
                  >
                    {index == 0 ? "A" : "B"}
                  </div>
                ))}
                {dots.length > 1 && (
                  <div style={{ position: "absolute", top: 0, left: 0 }}>
                    {dots.map((dot, index) => {
                      if (index < dots.length - 1) {
                        const nextDot = dots[index + 1];
                        const distance = calculateDistance(
                          dot,
                          nextDot
                        ).toFixed(2);
                        const midX = (dot.x + nextDot.x) / 2;
                        const midY = (dot.y + nextDot.y) / 2;

                        const dx = nextDot.x - dot.x;
                        const dy = nextDot.y - dot.y;
                        const radians = Math.atan2(dy, dx);
                        const degrees = radians * (180 / Math.PI);

                        return (
                          <div
                            className="relative text-[#0000ff]"
                            style={{ top: midY, left: midX }}
                          >
                            <p>{distance}mm</p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
                <div className="absolute right-4 bottom-4 flex gap-2">
                  <div className="">
                    X:{" "}
                    {(
                      xCoordinate *
                      Number(imageUrls[imageUrlIndex].pixelSpacing[1])
                    ).toFixed(2)}
                    mm
                  </div>
                  <div className="">
                    Y:{" "}
                    {(
                      yCoordinate *
                      Number(imageUrls[imageUrlIndex].pixelSpacing[0])
                    ).toFixed(2)}
                    mm
                  </div>
                </div>
                <div className="absolute left-4 bottom-4 flex gap-2">
                  <div className="">
                    W: {Number(imageUrls[imageUrlIndex].widthMM).toFixed(2)}mm
                  </div>
                  <div className="">
                    H: {Number(imageUrls[imageUrlIndex].heightMM).toFixed(2)}mm
                  </div>
                </div>
                <div className="absolute left-4 my-auto">
                  <div className="">R</div>
                </div>
                <div className="absolute right-4 my-auto">
                  <div className="">L</div>
                </div>
                <div className="absolute top-4 mx-auto">
                  <div className="">A</div>
                </div>
                <div className="absolute bottom-4 mx-auto">
                  <div className="">P</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
