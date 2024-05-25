# Overview

My online DICOM image viewer is a web application designed to display and interact with DICOM medical images directly in the browser. Utilizing modern web technologies, the application offers precise measurements and various navigational features to enhance the user experience.

# Technology Stack

## Frontend:

- Framework: Next.js (React)
- Styling: Tailwind CSS
- Language: TypeScript

## Libraries:

- cornerstone.js

# How It Works

The application leverages the cornerstone.js library to parse DICOM file header information and render the image(s) on the screen. The DICOM lump data is converted to JPEG format and then displayed with the <img> tag. The entire process is described below.

## File upload

- When the user uploads one or more DICOM files which are stored in an array

## DICOM to JPEG conversion

- A useEffect() hook detects a change in the array, sorts it, and converts each DICOM file into a JPEG image, storing each image's URL and associated DICOM header data in another array.
- The cornerstone.js library assists in image parsing and conversion.

## File preview selection

- The first image in the URLs array is selected to be the preview image which is displayed to users upon successful file upload.

## Displaying the images

- Upon successful upload and the user clicking on the "View DICOM Images" button, the first image is displayed on the viewer.

## Navigation

- Users can navigate multiple images by scrolling, using the up and down arrows in the upper-right of the viewer, or dragging and holding when the cursor is in cursor mode.
- Users can zoom into the images by pressing on the appropriate magnifying glasses toward the top of the viewer.
- Users can pan across the images by enabling and using the joystick. To enable, click on the joystick icon toward the top of the viewer. The joystick will appear near the bottom of the viewer.

## Measurements

- Users can measure the image by enabling crosshair mode by clicking on the target button toward the top left of the viewer.
- Once enabled, users measure by clicking on the image to place the "A" node followed by the "B" node.
- Currently, only linear distance measurements are supported.
- All measurements are shown in millimeters, calculated based off of the DICOM image's header data.

# Features

- View one or more DICOM images
- True-to-size coordinate and size tracking (e.g., converts pixels to mm based on DICOM image metadata)
- Navigate images by scrolling, arrow keys, or dragging
- True-to-size linear measurements (millimeters)

# Future Directions

- Ability for users to change views to axial, coronal, and sagittal
- Improved measuring mechanisms with additional shapes
- Enhanced contrast adjustment
- Joystick improvement
- Local storage history tracking
- Upgrade cornerstone library and other helpers to the latest version

# Testing Data

DICOM images sourced from platforms like Kaggle and dicomlibrary.com.

# About the Author

This project was developed by Tyler Haisman, a computer science student interested in medicine and aspiring to work in technology. For inquiries or collaborations, please contact Tyler via the "CONTACT" button in the header.

# References

- [Stack Overflow: Could not find a declaration file for module](https://stackoverflow.com/questions/70797210/could-not-find-a-declaration-file-for-module-mymodule)
- [Stack Overflow: Add a long press event in React](https://stackoverflow.com/questions/48048957/add-a-long-press-event-in-react)
- [Stack Overflow: Obtaining measurements from DICOM images](https://stackoverflow.com/questions/34389785/obtaining-measurements-from-dicom-images)
- [DICOM Innolitics: Image Plane Module Attributes](https://dicom.innolitics.com/ciods/rt-dose/image-plane/00200037)

# Run Locally

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
