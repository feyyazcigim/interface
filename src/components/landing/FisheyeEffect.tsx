import React from "react";

const FisheyeEffect = ({ children }) => {
  return (
    <div className="h-full relative" style={{ filter: "url(#SphereMapTest)" }}>
      <svg
        style={{ display: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        id="svg-root"
        width="1024"
        height="1024"
        viewBox="0 0 1024 1024"
      >
        <defs>
          <filter id="SphereMapTest" filterUnits="objectBoundingBox" x="-0.2" y="-0.2" width="1.4" height="1.4">
            <feImage id="mapa" result="map" href="sphere_displacement.png" />
            <feDisplacementMap
              id="despMap"
              in="SourceGraphic"
              in2="map"
              scale="15"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className="h-full w-full">{children}</div>
    </div>
  );
};

export default FisheyeEffect;
