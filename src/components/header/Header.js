import React from "react";
import "./style.css";

const Marquee = () => {
  return (
    <>
      <img className="star-img" src="assets/img/running.gif" />
      <img className="title-img"  src="assets/img/title.png" />
    </>
  );
};

const Header = () => {
  return (
    <div className="header" style={{backgroundImage:'url("./assets/img/header-bg.png")'}}>
      <div className="marquee-wrapper marquee-container manual-wrapper">
        <div className="marquee animation-style">
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
        </div>
        <div className="marquee animation-style">
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
          <Marquee />
        </div>
      </div>
    </div>
  );
};

export default Header;
