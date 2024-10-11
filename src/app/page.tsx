/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useRef, useEffect } from "react";
import Quagga from "@ericblade/quagga2";
import Scanner from "./Scanner";
import Result from "./Result";
import { getInfo } from "./getInfo";

const App = () => {
  const [scanning, setScanning] = useState(true); // toggleable state for "should render scanner"
  const [cameras, setCameras] = useState([]); // array of available cameras, as returned by Quagga.CameraAccess.enumerateVideoDevices()
  const [cameraId, setCameraId] = useState(null); // id of the active camera device
  const [cameraError, setCameraError] = useState(null); // error message from failing to access the camera
  const [results, setResults] = useState([]); // list of scanned results
  const scannerRef = useRef(null); // reference to the scanner element in the DOM
  const [info, setInfo] = useState({ keywords: [], image_url: "" });

  async function updateResults(result) {
    setResults([...results, result]);
    setInfo(await getInfo(result.codeResult.code));
  }

  // at start, we need to get a list of the available cameras.  We can do that with Quagga.CameraAccess.enumerateVideoDevices.
  // HOWEVER, Android will not allow enumeratioupdateResultsn to occur unless the user has granted camera permissions to the app/page.
  // AS WELL, Android will not ask for permission until you actually try to USE the camera, just enumerating the devices is not enough to trigger the permission prompt.
  // THEREFORE, if we're going to be running in Android, we need to first call Quagga.CameraAccess.request() to trigger the permission prompt.
  // AND THEN, we need to call Quagga.CameraAccess.release() to release the camera so that it can be used by the scanner.
  // AND FINALLY, we can call Quagga.CameraAccess.enumerateVideoDevices() to get the list of cameras.

  // Normally, I would place this in an application level "initialization" event, but for this demo, I'm just going to put it in a useEffect() hook in the App component.

  useEffect(() => {
    const enableCamera = async () => {
      await Quagga.CameraAccess.request(null, {});
    };
    const disableCamera = async () => {
      await Quagga.CameraAccess.release();
    };
    const enumerateCameras = async () => {
      const cameras = await Quagga.CameraAccess.enumerateVideoDevices();
      console.log("Cameras Detected: ", cameras);
      return cameras;
    };
    enableCamera()
      .then(disableCamera)
      .then(enumerateCameras)
      .then((cameras) => setCameras(cameras))
      .then(() => Quagga.CameraAccess.disableTorch())
      .catch((err) => setCameraError(err));
    return () => {
      disableCamera();
    };
  }, []);

  return (
    <div>
      {/* {cameraError ? (
        <p>
          ERROR INITIALIZING CAMERA ${JSON.stringify(cameraError)} -- DO YOU
          HAVE PERMISSION?
        </p>
      ) : null}
      {cameras.length === 0 ? (
        <p>
          Enumerating Cameras, browser may be prompting for permissions
          beforehand
        </p>
      ) : (
        <form>
          <select onChange={(event) => setCameraId(event.target.value)}>
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || camera.deviceId}
              </option>
            ))}
          </select>
        </form>
      )} */}
      <ul className="results">
        {results.map(
          (result) =>
            result.codeResult && (
              <Result key={result.codeResult.code} result={result} />
            )
        )}
      </ul>
      {info.keywords.length > 0 ? (
        <div>
          <h2>Product Information</h2>
          <img src={info.image_url} alt="product" />
          <ul>
            {info.keywords.map((keyword) => (
              <li key={keyword}>{keyword}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div
        ref={scannerRef}
        style={{ position: "relative", border: "3px solid red" }}
      >
        {/* <video style={{ width: window.innerWidth, height: 480, border: '3px solid orange' }}/> */}
        <canvas
          className="drawingBuffer"
          style={{
            position: "absolute",
            top: "0px",
            // left: '0px',
            // height: '100%',
            // width: '100%',
            border: "3px solid green",
          }}
          width="640"
          height="480"
        />
        {scanning ? (
          <Scanner
            scannerRef={scannerRef}
            cameraId={cameraId}
            onDetected={(result) => updateResults(result)}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
